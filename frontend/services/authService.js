const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(credentials) {
    await wait();
    // Backend hook: POST /auth/login
    return { success: true, token: 'mock-token', userRole: credentials.email?.includes('admin') ? 'admin' : 'customer' };
  },
  async register(payload) {
    await wait();
    // Backend hook: POST /auth/register + email verification workflow
    return { success: true, requiresEmailVerification: true, payload };
  },
  async forgotPassword(email) {
    await wait();
    // Backend hook: POST /auth/forgot-password
    return { success: true, email };
  },
  async logout() {
    await wait();
    // Backend hook: POST /auth/logout / invalidate token
    return { success: true };
  },
};
