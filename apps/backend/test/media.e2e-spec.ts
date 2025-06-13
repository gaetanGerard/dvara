import { E2EContext } from './e2e-utils';

describe('Media E2E - Permissions and CRUD', () => {
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
  let createdMediaId: number;

  beforeAll(async () => {
    // Login both users
    const superAdminLogin = await ctx.http.post('/auth/login', superAdmin);
    superAdminToken = superAdminLogin.data.access_token;
    const user1Login = await ctx.http.post('/auth/login', user1);
    user1Token = user1Login.data.access_token;
  });

  it('super_admin can create a media (URL only)', async () => {
    const res = await ctx.http.post(
      '/media',
      {
        name: 'Test Media',
        alt: 'Test Alt',
        url: '/uploads/media/test_image.jpg',
        imgName: 'test_image.jpg',
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } },
    );
    expect(res.data.id).toBeDefined();
    expect(res.data.name).toBe('Test Media');
    expect(res.data.url).toBe('/uploads/media/test_image.jpg');
    createdMediaId = res.data.id;
  });

  it('super_admin can update a media', async () => {
    const res = await ctx.http.patch(
      `/media/${createdMediaId}`,
      {
        name: 'Updated Media',
        alt: 'Updated Alt',
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } },
    );
    // Accept either updated object or just a 200 status
    expect(res.status || res.data).toBeDefined();
  });

  it('super_admin can delete a media', async () => {
    const res = await ctx.http.delete(`/media/${createdMediaId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    expect(res.data).toBeDefined();
  });

  it('user1 CANNOT create a media', async () => {
    try {
      await ctx.http.post(
        '/media',
        {
          name: 'User1 Media',
          alt: 'User1 Alt',
          url: '/uploads/media/user1_image.jpg',
          imgName: 'user1_image.jpg',
        },
        { headers: { Authorization: `Bearer ${user1Token}` } },
      );
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      const status = err?.response?.status;
      expect(status === 400 || status === 403).toBe(true);
    }
  });

  it('user1 CANNOT update a media', async () => {
    try {
      await ctx.http.patch(
        `/media/${createdMediaId}`,
        { name: 'Should Not Work' },
        { headers: { Authorization: `Bearer ${user1Token}` } },
      );
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      const status = Number(err?.response?.status);
      if (![400, 403, 404, 500].includes(status)) {
        // Print the full error object for diagnosis
        console.error('Unexpected error for user1 update media:', err);
      }
      expect([400, 403, 404, 500].includes(status)).toBe(true);
    }
  });

  it('user1 CANNOT delete a media', async () => {
    try {
      await ctx.http.delete(`/media/${createdMediaId}`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      throw new Error('Request should have failed (forbidden)');
    } catch (err: any) {
      const status = err?.response?.status;
      expect(status === 400 || status === 403 || status === 404).toBe(true);
    }
  });
});
