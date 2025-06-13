import { E2EContext } from './e2e-utils';

describe('Group Module (e2e)', () => {
  const ctx = new E2EContext('http://localhost:3000');

  const superAdmin = {
    email: 'superadmin@dvara.local',
    password: 'superadmin123',
  };
  const user1 = {
    email: 'user1@dvara.local',
    password: 'user1pass',
  };

  let createdGroupId: number;

  beforeAll(async () => {
    await ctx.loginUser('superAdmin', superAdmin.email, superAdmin.password);
    await ctx.loginUser('user1', user1.email, user1.password);
  });

  afterAll(async () => {
    if (createdGroupId) {
      try {
        await ctx.http.delete(`/group/${createdGroupId}`, {
          headers: ctx.getAuthHeaders('superAdmin'),
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  describe('Super Admin CRUD', () => {
    it('can create a group', async () => {
      const uniqueName = `Test Group ${Date.now()}`;
      try {
        const res = await ctx.http.post(
          '/group',
          { name: uniqueName },
          { headers: ctx.getAuthHeaders('superAdmin') },
        );
        expect(res.data.id).toBeDefined();
        createdGroupId = res.data.id;
      } catch (err: any) {
        console.error('CREATE GROUP ERROR:', err?.response?.data || err);
        throw err;
      }
    });

    it('can list all groups', async () => {
      const res = await ctx.http.get('/group', {
        headers: ctx.getAuthHeaders('superAdmin'),
      });
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('can get group details', async () => {
      const res = await ctx.http.get(`/group/${createdGroupId}`, {
        headers: ctx.getAuthHeaders('superAdmin'),
      });
      expect(res.data.id).toBe(createdGroupId);
    });

    it('can update a group', async () => {
      const res = await ctx.http.patch(
        `/group/${createdGroupId}`,
        {},
        { headers: ctx.getAuthHeaders('superAdmin') },
      );
      expect(res.data.id).toBe(createdGroupId);
    });

    it('can delete a group', async () => {
      const res = await ctx.http.delete(`/group/${createdGroupId}`, {
        headers: ctx.getAuthHeaders('superAdmin'),
      });
      expect(res.data).toBeDefined();
    });
  });

  describe('Regular user (lambda)', () => {
    it('can list all groups', async () => {
      const res = await ctx.http.get('/group', {
        headers: ctx.getAuthHeaders('user1'),
      });
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('cannot create a group', async () => {
      try {
        await ctx.http.post(
          '/group',
          { name: 'User Group' },
          { headers: ctx.getAuthHeaders('user1') },
        );
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        const status = err?.response?.status;
        expect([401, 403].includes(Number(status))).toBe(true);
      }
    });

    it('cannot update a group', async () => {
      try {
        await ctx.http.patch(
          `/group/1`,
          {},
          { headers: ctx.getAuthHeaders('user1') },
        );
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        const status = err?.response?.status;
        expect([401, 403].includes(Number(status))).toBe(true);
      }
    });

    it('cannot delete a group', async () => {
      try {
        await ctx.http.delete(`/group/1`, {
          headers: ctx.getAuthHeaders('user1'),
        });
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        const status = err?.response?.status;
        expect([401, 403].includes(Number(status))).toBe(true);
      }
    });

    it('cannot get group details', async () => {
      try {
        await ctx.http.get(`/group/1`, {
          headers: ctx.getAuthHeaders('user1'),
        });
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        const status = err?.response?.status;
        expect([401, 403].includes(Number(status))).toBe(true);
      }
    });
  });
});
