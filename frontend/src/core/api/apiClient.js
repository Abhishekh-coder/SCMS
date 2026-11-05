/**
 * CCMS Enterprise API Client v2.0
 * Supports tab-isolated sessionStorage, per-tab session ID, traceId generation,
 * audit context headers, per-tab refresh token rotation, and response envelope unwrapping.
 */

class ApiClient {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    this.accessToken = this.readStorageToken();
    this.refreshingPromise = null;
  }

  getSessionId() {
    if (typeof window === 'undefined') return 'sess_server';
    let sessionId = sessionStorage.getItem('ccms_session_id');
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      sessionStorage.setItem('ccms_session_id', sessionId);
    }
    return sessionId;
  }

  readStorageToken() {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('ccms_token') || sessionStorage.getItem('ccms_access_token') || null;
  }

  getAccessToken() {
    return this.accessToken || this.readStorageToken();
  }

  setAccessToken(token) {
    this.accessToken = token;
    if (typeof window === 'undefined') return;
    if (token) {
      sessionStorage.setItem('ccms_token', token);
      sessionStorage.setItem('ccms_access_token', token);
    } else {
      sessionStorage.removeItem('ccms_token');
      sessionStorage.removeItem('ccms_access_token');
    }
  }

  setRefreshToken(refreshToken) {
    if (typeof window === 'undefined') return;
    if (refreshToken) {
      sessionStorage.setItem('ccms_refresh_token', refreshToken);
    } else {
      sessionStorage.removeItem('ccms_refresh_token');
    }
  }

  clearSession() {
    this.setAccessToken(null);
    this.setRefreshToken(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ccms_user');
      sessionStorage.removeItem('ccms_active_role');
      window.dispatchEvent(new CustomEvent('ccms:unauthorized'));
    }
  }

  isTokenExpiringSoon(token, bufferSeconds = 60) {
    if (!token) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return (payload.exp * 1000) - Date.now() <= bufferSeconds * 1000;
    } catch (e) {
      return false;
    }
  }

  getHeaders(customHeaders = {}) {
    const activeToken = this.getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      'x-trace-id': `tr-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
      'x-session-id': this.getSessionId(),
      'x-client-device': 'WEB_BROWSER',
      ...customHeaders,
    };

    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh');
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Proactive silent refresh check before dispatching request (tab-local)
    const currentToken = this.getAccessToken();
    if (currentToken && !isAuthEndpoint && this.isTokenExpiringSoon(currentToken, 60)) {
      await this.handleTokenRefresh();
    }

    const headers = this.getHeaders(options.headers);
    const config = {
      ...options,
      headers,
    };

    try {
      let response = await fetch(url, config);

      // Handle 401 Unauthorized token refresh
      if (response.status === 401 && !isAuthEndpoint) {
        let errorCode = null;
        try {
          const clonedRes = response.clone();
          const payload = await clonedRes.json();
          errorCode = payload?.error?.code || payload?.code || payload?.errorCode;
        } catch (e) {
          // Response body not JSON
        }

        if (errorCode === 'AUTH_007' && !options._retry) {
          options._retry = true;
          const refreshed = await this.handleTokenRefresh();
          if (refreshed) {
            config.headers = this.getHeaders(options.headers);
            response = await fetch(url, config);
          } else {
            this.clearSession();
          }
        } else if (errorCode !== 'AUTH_007') {
          // Genuine non-refreshable auth failure (e.g. invalid signature, revoked session)
          this.clearSession();
        }
      }

      const contentType = response.headers.get('content-type');
      let payload;

      if (contentType && contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        payload = await response.text();
      }

      if (!response.ok) {
        const errorMessage = (payload && payload.error && payload.error.message) 
          || (payload && payload.message) 
          || `HTTP Error ${response.status}: ${response.statusText}`;
        const errorCode = (payload && payload.error && payload.error.code) || 'API_ERROR';
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = errorCode;
        error.traceId = (payload && payload.traceId) || headers['x-trace-id'];
        throw error;
      }

      return payload;
    } catch (err) {
      throw err;
    }
  }

  async handleTokenRefresh() {
    if (this.refreshingPromise) {
      return this.refreshingPromise;
    }

    this.refreshingPromise = (async () => {
      try {
        if (typeof window === 'undefined') return false;
        const refreshToken = sessionStorage.getItem('ccms_refresh_token');
        if (!refreshToken) {
          this.clearSession();
          return false;
        }

        const res = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': this.getSessionId()
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          this.clearSession();
          return false;
        }

        const payload = await res.json();
        if (payload.success && payload.data && payload.data.accessToken) {
          this.setAccessToken(payload.data.accessToken);
          if (payload.data.refreshToken) {
            this.setRefreshToken(payload.data.refreshToken);
          }
          window.dispatchEvent(new CustomEvent('ccms:tokens-refreshed', {
            detail: { accessToken: payload.data.accessToken }
          }));
          return true;
        }

        this.clearSession();
        return false;
      } catch (e) {
        this.clearSession();
        return false;
      } finally {
        this.refreshingPromise = null;
      }
    })();

    return this.refreshingPromise;
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body), headers });
  }

  patch(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(body), headers });
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
