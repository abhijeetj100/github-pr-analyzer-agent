function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  return res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
