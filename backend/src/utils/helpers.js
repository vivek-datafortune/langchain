export function formatResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export function formatError(error, status = 500) {
  return {
    success: false,
    error: error.message || 'An error occurred',
    status,
    timestamp: new Date().toISOString()
  };
}

export function validateEnvironmentVariables(required = []) {
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

export default {
  formatResponse,
  formatError,
  validateEnvironmentVariables
};
