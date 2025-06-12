import { E2EContext } from './e2e-utils';

describe('Settings E2E - Permissions and Update', () => {
  const ctx = new E2EContext('http://localhost:3000');

  const superAdmin = {
    email: 'superadmin@dvara.local',
    password: 'superadmin123',
  };
  const user1 = {
    email: 'user1@dvara.local',
    password: 'user1pass',
  };

  let superAdminToken: string;
  let user1Token: string;

  beforeAll(async () => {
    // Login both users
    const superAdminLogin = await ctx.http.post('/auth/login', superAdmin);
    superAdminToken = superAdminLogin.data.access_token;
    const user1Login = await ctx.http.post('/auth/login', user1);
    user1Token = user1Login.data.access_token;
  });

  it('super_admin can update settings', async () => {
    const res = await ctx.http.patch(
      '/settings',
      {
        theme: 'dark',
        title: 'Test Title',
        main_color: '#000000',
        secondary_color: '#ffffff',
        description: 'Test description',
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } },
    );
    expect(res.data.theme).toBe('dark');
    expect(res.data.title).toBe('Test Title');
    expect(res.data.main_color).toBe('#000000');
    expect(res.data.secondary_color).toBe('#ffffff');
    expect(res.data.description).toBe('Test description');
  });

  it('user1 CANNOT update settings (forbidden)', async () => {
    try {
      await ctx.http.patch(
        '/settings',
        {
          theme: 'light',
          title: 'Should not work',
          main_color: '#111111',
          secondary_color: '#222222',
        },
        { headers: { Authorization: `Bearer ${user1Token}` } },
      );
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      const status = err?.response?.status;
      expect(status === 400 || status === 403).toBe(true);
    }
  });

  it('unauthenticated user CANNOT update settings', async () => {
    try {
      await ctx.http.patch('/settings', {
        theme: 'light',
        title: 'Should not work',
        main_color: '#111111',
        secondary_color: '#222222',
      });
      throw new Error('Request should have failed (unauthorized)');
    } catch (err: any) {
      const status = err?.response?.status;
      expect(status === 401 || status === 403).toBe(true);
    }
  });

  it('super_admin can get settings', async () => {
    const res = await ctx.http.get('/settings', {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    expect(res.data.theme).toBeDefined();
    expect(res.data.title).toBeDefined();
    expect(res.data.main_color).toBeDefined();
    expect(res.data.secondary_color).toBeDefined();
  });

  it('user1 CANNOT get settings (forbidden)', async () => {
    try {
      await ctx.http.get('/settings', {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      const status = err?.response?.status;
      expect(status === 400 || status === 403).toBe(true);
    }
  });

  it('unauthenticated user CANNOT get settings', async () => {
    try {
      await ctx.http.get('/settings');
      throw new Error('Request should have failed (unauthorized)');
    } catch (err: any) {
      const status = err?.response?.status;
      expect(status === 401 || status === 403).toBe(true);
    }
  });
});
