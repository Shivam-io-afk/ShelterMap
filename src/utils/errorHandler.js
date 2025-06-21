// Error handling utilities
export class AppError extends Error {
  constructor(message, type = 'general', code = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
  }
}

export const handleApiError = (error, context = '') => {
  console.error(`API Error in ${context}:`, error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 401:
        return new AppError('Authentication failed. Please check your API keys.', 'auth', status);
      case 403:
        return new AppError('Access denied. Please check your permissions.', 'auth', status);
      case 404:
        return new AppError('Resource not found.', 'not_found', status);
      case 429:
        return new AppError('Rate limit exceeded. Please try again later.', 'rate_limit', status);
      case 500:
        return new AppError('Server error. Please try again later.', 'server', status);
      default:
        return new AppError(`Request failed with status ${status}`, 'api', status);
    }
  } else if (error.request) {
    // Network error
    return new AppError('Network error. Please check your internet connection.', 'network');
  } else {
    // Other errors
    return new AppError(error.message || 'An unexpected error occurred.', 'general');
  }
};

export const showErrorAlert = (error) => {
  const message = error instanceof AppError ? error.message : error;
  alert(message);
};

export const logError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  // In production, you might want to send this to a logging service
}; 