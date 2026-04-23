const path = require('path');
const { pathToFileURL } = require('url');
const { createSeedUsers } = require('./seedUsers');

const frontendMockPath = path.resolve(__dirname, '..', '..', 'frontend', 'data', 'mockData.js');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadMockData() {
  return import(pathToFileURL(frontendMockPath).href);
}

function createSeedOrders(initialOrders, customerId) {
  return clone(initialOrders).map((order) => ({
    ...order,
    userId: customerId,
  }));
}

async function createSeedData() {
  const mockData = await loadMockData();
  const customerId = 'user-customer-1';

  return {
    homeContent: clone(mockData.initialHomeContent),
    categories: clone(mockData.initialCategories),
    products: clone(mockData.initialProducts),
    users: createSeedUsers(mockData.initialUser, customerId, clone),
    orders: createSeedOrders(mockData.initialOrders, customerId),
    sessions: [],
    supportMessages: [],
    chatMessages: [],
  };
}

module.exports = { createSeedData };
