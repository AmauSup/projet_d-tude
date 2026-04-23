const { handleAuthRoutes } = require('./authRoutes');
const { handleAccountRoutes } = require('./accountRoutes');
const { handleProductRoutes } = require('./productRoutes');
const { handleOrderRoutes } = require('./orderRoutes');
const { sendError } = require('../utils/http');

async function router(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const ctx = { pathname: url.pathname, searchParams: url.searchParams };

  const handlers = [
    handleAuthRoutes,
    handleAccountRoutes,
    handleProductRoutes,
    handleOrderRoutes,
  ];

  try {
    for (const handler of handlers) {
      const handled = await handler(req, res, ctx);
      if (handled) return;
    }

    sendError(res, 404, 'Route introuvable');
  } catch (err) {
    sendError(res, 500, err.message);
  }
}

module.exports = { router };