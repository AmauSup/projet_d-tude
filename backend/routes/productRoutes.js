const { readDb } = require('../data/store');
const { sendJson } = require('../utils/http');

const LIST_PRODUCTS_ROUTE = '/api/products';

function isListProductsRequest(req, pathname) {
  return req.method === 'GET' && pathname === LIST_PRODUCTS_ROUTE;
}

async function listProducts(res) {
  const db = await readDb();

  sendJson(res, 200, {
    success: true,
    products: db.products,
  });

  return true;
}

async function handleProductRoutes(req, res, { pathname }) {
  if (!isListProductsRequest(req, pathname)) {
    return false;
  }

  return listProducts(res);
}

module.exports = { handleProductRoutes };
