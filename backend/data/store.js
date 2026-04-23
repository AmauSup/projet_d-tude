const fs = require('fs/promises');
const path = require('path');
const { pathToFileURL } = require('url');

const dbFilePath = path.join(__dirname, 'db.json');
const frontendMockPath = path.resolve(__dirname, '..', '..', 'frontend', 'data', 'mockData.js');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function createSeedData() {
  const mockDataModule = await import(pathToFileURL(frontendMockPath).href);
  const {
    initialCategories,
    initialHomeContent,
    initialOrders,
    initialProducts,
    initialUser,
  } = mockDataModule;

  const customerId = 'user-customer-1';

  return {
    homeContent: clone(initialHomeContent),
    categories: clone(initialCategories),
    products: clone(initialProducts),
    users: [
      {
        id: 'user-admin-1',
        firstName: 'Admin',
        lastName: 'Althea',
        email: 'admin@althea.medical',
        password: 'Admin123!',
        phone: '+33 1 80 00 00 00',
        company: 'Althea Medical',
        verified: true,
        role: 'admin',
        addresses: [],
        paymentMethods: [],
      },
      {
        id: customerId,
        firstName: initialUser.firstName,
        lastName: initialUser.lastName,
        email: initialUser.email,
        password: 'Password123!',
        phone: initialUser.phone,
        company: initialUser.company,
        verified: initialUser.verified,
        role: initialUser.role,
        addresses: clone(initialUser.addresses),
        paymentMethods: clone(initialUser.paymentMethods),
      },
    ],
    orders: clone(initialOrders).map((order) => ({
      ...order,
      userId: customerId,
    })),
    sessions: [],
    supportMessages: [],
    chatMessages: [],
  };
}

async function ensureDbFile() {
  try {
    await fs.access(dbFilePath);
  } catch {
    const seedData = await createSeedData();
    await fs.mkdir(path.dirname(dbFilePath), { recursive: true });
    await fs.writeFile(dbFilePath, JSON.stringify(seedData, null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(dbFilePath, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(nextDb) {
  await fs.writeFile(dbFilePath, JSON.stringify(nextDb, null, 2), 'utf8');
  return nextDb;
}

async function updateDb(updater) {
  const currentDb = await readDb();
  const updatedDb = (await updater(currentDb)) ?? currentDb;
  return writeDb(updatedDb);
}

module.exports = {
  ensureDbFile,
  readDb,
  updateDb,
  writeDb,
};
