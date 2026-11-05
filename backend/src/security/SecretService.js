class SecretService {
  getSecret(keyName, defaultValue = null) {
    if (process.env[keyName]) {
      return process.env[keyName];
    }
    return defaultValue;
  }

  getJwtSecret() {
    return this.getSecret('JWT_SECRET', 'dev_jwt_secret_placeholder_key_32chars_min');
  }

  getChatbotApiKey() {
    return this.getSecret('CHATBOT_API_KEY', process.env.GEMINI_API_KEY || 'dev_chatbot_api_key_placeholder');
  }
}

module.exports = new SecretService();
