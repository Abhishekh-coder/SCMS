import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './app/router/AppRouter';
import './styles/index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by Root ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7FAFE] text-slate-800 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mb-4 text-2xl border border-red-200">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong while rendering this view</h2>
          <p className="text-sm text-slate-600 max-w-md mb-6 font-mono text-xs bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-left overflow-auto max-h-32">
            {this.state.error?.message || 'Unknown render error'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>
);

