const { updateDb } = require('../data/store');
const { sendJson, sendError, readJsonBody } = require('../utils/http');

const CREATE_ORDER_ROUTE = '/api/orders';

function isCreateOrderRequest(req, pathname) {
  return req.method === 'POST' && pathname === CREATE_ORDER_ROUTE;
}

function hasOrderItems(body) {
  return Array.isArray(body.items) && body.items.length > 0;
}

function buildOrder(items) {
  return {
    id: `cmd-${Date.now()}`,
    items,
    createdAt: new Date().toISOString(),
  };
}

async function saveOrder(order) {
  await updateDb((draft) => {
    draft.orders.unshift(order);
  });
}

async function createOrder(req, res) {
  const body = await readJsonBody(req);

  if (!hasOrderItems(body)) {
    sendError(res, 400, 'Panier vide');
    return true;
  }

  const order = buildOrder(body.items);
  await saveOrder(order);

  sendJson(res, 201, {
    success: true,
    order,
  });

  return true;
}

async function handleOrderRoutes(req, res, { pathname }) {
  if (!isCreateOrderRequest(req, pathname)) {
    return false;
  }

  return createOrder(req, res);
}

module.exports = { handleOrderRoutes };
