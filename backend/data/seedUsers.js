function createAdminUser() {
  return {
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
  };
}

function createCustomerUser(initialUser, customerId, clone) {
  return {
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
  };
}

function createSeedUsers(initialUser, customerId, clone) {
  return [
    createAdminUser(),
    createCustomerUser(initialUser, customerId, clone),
  ];
}

module.exports = { createSeedUsers };
