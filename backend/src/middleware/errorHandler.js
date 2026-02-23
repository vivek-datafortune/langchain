export async function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] Error (${status}): ${message}`);

  res.status(status).json({
    error: {
      status,
      message,
      timestamp
    }
  });
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  asyncHandler
};
