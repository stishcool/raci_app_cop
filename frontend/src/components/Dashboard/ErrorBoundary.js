import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h3>Ошибка рендеринга</h3>
          <p>{this.state.error?.message || 'Что-то пошло не так.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;