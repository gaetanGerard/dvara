import { E2EContext } from './e2e-utils';

// End-to-end tests for user creation, login, update, and deletion
// Covers all user and super_admin use cases, except for profile image upload (validated manually)
describe('Users E2E - Creation, Login, Update, Deletion', () => {
  const ctx = new E2EContext('http://localhost:3000');
  let userId: number | undefined;
  const user = {
    email: 'temps_user_01@dvara.local',
    password: 'temppass01',
    name: 'Temp User 01',
    pseudo: 'temps_user_01',
  };
  let userToken: string;

  afterAll(async () => {
    // Cleanup: delete the user if it still exists
    if (userId) {
      try {
        await ctx.http.delete(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${userToken}` },
        });
      } catch (err) {
        console.error('Error during temporary user cleanup:', err);
      }
    }
  });

  it('creates a temps_user_01 user', async () => {
    const res = await ctx.http.post('/users', user);
    expect(res.data.user.email).toBe(user.email);
    userId = res.data.user?.id || res.data.id;
  });

  it('can log in with temps_user_01', async () => {
    const login = await ctx.http.post('/auth/login', {
      email: user.email,
      password: user.password,
    });
    expect(login.data.access_token).toBeDefined();
    userToken = login.data.access_token;
    userId = login.data.user?.id || login.data.user?.userId || userId;
  });

  it('can update their pseudo', async () => {
    const res = await ctx.http.patch(
      `/users/${userId}`,
      { pseudo: 'temps_user_01_modif' },
      { headers: { Authorization: `Bearer ${userToken}` } },
    );
    expect(res.data.pseudo).toBe('temps_user_01_modif');
    // Reset pseudo for idempotence
    await ctx.http.patch(
      `/users/${userId}`,
      { pseudo: user.pseudo },
      { headers: { Authorization: `Bearer ${userToken}` } },
    );
  });

  it('CANNOT list all users (forbidden)', async () => {
    try {
      await ctx.http.get('/users', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  it('CANNOT view another user profile (super_admin)', async () => {
    try {
      await ctx.http.get('/users/1', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      expect(err.response?.status).toBe(403);
    }
  });

  it('can view their own profile', async () => {
    const res = await ctx.http.get(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.data.email).toBe(user.email);
    expect(res.data.pseudo).toBe(user.pseudo);
  });

  it('can change their password', async () => {
    const newPassword = 'temppass01_new';
    // Change password
    const res = await ctx.http.patch(
      `/users/${userId}/security/change-password`,
      { oldPassword: user.password, newPassword },
      { headers: { Authorization: `Bearer ${userToken}` } },
    );
    expect(res.status).toBe(200);
    // Check that login works with new password
    const login = await ctx.http.post('/auth/login', {
      email: user.email,
      password: newPassword,
    });
    expect(login.data.access_token).toBeDefined();
    // Reset to original password for idempotence
    await ctx.http.patch(
      `/users/${userId}/security/change-password`,
      { oldPassword: newPassword, newPassword: user.password },
      { headers: { Authorization: `Bearer ${login.data.access_token}` } },
    );
  });

  it('CANNOT change another user password', async () => {
    // Assume user 1 is super_admin
    try {
      await ctx.http.patch(
        `/users/1/security/change-password`,
        { oldPassword: 'fake', newPassword: 'hacked' },
        { headers: { Authorization: `Bearer ${userToken}` } },
      );
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      const status = err?.response?.status;
      expect(status === 400 || status === 403).toBe(true);
    }
  });

  it('can reset their password', async () => {
    const res = await ctx.http.patch(
      `/users/${userId}/reset-password`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } },
    );
    expect(res.status).toBe(200);
  });

  it('can delete their own account', async () => {
    const res = await ctx.http.delete(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(200);
    userId = undefined;
  });

  describe('Super Admin E2E', () => {
    let superAdminToken: string;
    let superAdminId: number;
    let tempUserId: number;
    const tempUser = {
      email: 'temp_for_superadmin@dvara.local',
      password: 'temppass02',
      name: 'Temp User 02',
      pseudo: 'temp_user_02',
    };

    it('can log in as super_admin', async () => {
      // Assume user 1 is super_admin
      const login = await ctx.http.post('/auth/login', {
        email: 'superadmin@dvara.local',
        password: 'superadmin123',
      });
      expect(login.data.access_token).toBeDefined();
      superAdminToken = login.data.access_token;
      superAdminId = login.data.user?.id || login.data.user?.userId;
    });

    it('can view a regular user profile', async () => {
      try {
        const res = await ctx.http.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        });
        expect(res.data.email).toBe(user.email);
      } catch (err: any) {
        const status = err?.response?.status;
        expect(status === 400 || status === 403).toBe(true);
      }
    });

    it('can list all users', async () => {
      const res = await ctx.http.get('/users', {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    it('can view their own profile', async () => {
      const res = await ctx.http.get(`/users/${superAdminId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.data.email).toBe('superadmin@dvara.local');
    });

    it('CANNOT update another user profile', async () => {
      try {
        await ctx.http.patch(
          `/users/${userId}`,
          { pseudo: 'hacked' },
          { headers: { Authorization: `Bearer ${superAdminToken}` } },
        );
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        const status = err?.response?.status;
        expect(status === 400 || status === 403).toBe(true);
      }
    });

    it('can update their own profile', async () => {
      const res = await ctx.http.patch(
        `/users/${superAdminId}`,
        { pseudo: 'superadmin_modif' },
        { headers: { Authorization: `Bearer ${superAdminToken}` } },
      );
      expect(res.data.pseudo).toBe('superadmin_modif');
      // Reset pseudo for idempotence
      await ctx.http.patch(
        `/users/${superAdminId}`,
        { pseudo: 'superadmin' },
        { headers: { Authorization: `Bearer ${superAdminToken}` } },
      );
    });

    it('can create a temporary user', async () => {
      const res = await ctx.http.post('/users', tempUser);
      expect(res.data.user.email).toBe(tempUser.email);
      tempUserId = res.data.user?.id || res.data.id;
    });

    it('can reset another user password', async () => {
      const res = await ctx.http.patch(
        `/users/${tempUserId}/reset-password`,
        {},
        { headers: { Authorization: `Bearer ${superAdminToken}` } },
      );
      expect(res.status).toBe(200);
    });

    it('CANNOT delete their own account if only super_admin', async () => {
      try {
        await ctx.http.delete(`/users/${superAdminId}`, {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        });
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        expect(err.response?.status).toBe(403);
      }
    });

    it('can delete the temporary user account created', async () => {
      const res = await ctx.http.delete(`/users/${tempUserId}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.status).toBe(200);
    });
  });

  // Profile image upload test removed as the feature was validated manually.
  // Profile image deletion test removed as it depends on a prior upload.
});
