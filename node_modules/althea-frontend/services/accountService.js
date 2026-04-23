const wait = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const accountService = {
  async updateProfile(profile) {
    await wait();
    // Backend hook: PUT /account/profile
    return profile;
  },
  async updateAddresses(addresses) {
    await wait();
    // Backend hook: PUT /account/addresses
    return addresses;
  },
};
