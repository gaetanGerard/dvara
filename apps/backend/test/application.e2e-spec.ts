import { E2EContext } from './e2e-utils';

describe('Application Module (e2e)', () => {
  const ctx = new E2EContext('http://localhost:3000');

  const superAdmin = {
    email: 'superadmin@dvara.local',
    password: 'superadmin123',
  };
  const user1 = {
    email: 'user1@dvara.local',
    password: 'user1pass',
  };

  let createdAppId: number | undefined;
  let iconMediaId: number;

  beforeAll(async () => {
    await ctx.loginUser('superAdmin', superAdmin.email, superAdmin.password);
    await ctx.loginUser('user1', user1.email, user1.password);
    // Crée une image pour l'icône d'application (media)
    const mediaRes = await ctx.http.post(
      '/media',
      {
        name: 'test-app-icon',
        imgName: `test-app-icon-${Date.now()}`,
        alt: 'icon',
        url: 'https://dummyimage.com/100x100/000/fff',
      },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    iconMediaId = mediaRes.data.id;
  });

  afterAll(async () => {
    if (createdAppId) {
      try {
        await ctx.http.delete(`/application/${createdAppId}`, {
          headers: ctx.getAuthHeaders('superAdmin'),
        });
      } catch (err) {
        // Log l'erreur de cleanup application
        console.error('Cleanup application error:', err?.response?.data || err);
      }
    }
    if (iconMediaId) {
      try {
        await ctx.http.delete(`/media/${iconMediaId}`, {
          headers: ctx.getAuthHeaders('superAdmin'),
        });
      } catch (err) {
        const status = err?.response?.status;
        if (![400, 404].includes(Number(status))) {
          // Log seulement si ce n'est pas une erreur attendue (media déjà supprimé)
          console.error('Cleanup media error:', err?.response?.data || err);
        }
      }
    }
  });

  describe('Super Admin CRUD', () => {
    it('can create an application', async () => {
      const res = await ctx.http.post(
        '/application',
        {
          name: `Test App ${Date.now()}`,
          iconMediaId,
          description: 'desc',
          url: 'https://test.com',
        },
        { headers: ctx.getAuthHeaders('superAdmin') },
      );
      expect(res.data.id).toBeDefined();
      createdAppId = res.data.id;
    });

    it('can list all applications', async () => {
      const res = await ctx.http.get('/application', {
        headers: ctx.getAuthHeaders('superAdmin'),
      });
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('can get application details', async () => {
      const res = await ctx.http.get(`/application/${createdAppId}`, {
        headers: ctx.getAuthHeaders('superAdmin'),
      });
      expect(res.data.id).toBe(createdAppId);
    });

    it('can update an application', async () => {
      const res = await ctx.http.patch(
        `/application/${createdAppId}`,
        { description: 'updated desc' },
        { headers: ctx.getAuthHeaders('superAdmin') },
      );
      expect(res.data.id).toBe(createdAppId);
    });

    it('can delete an application', async () => {
      const res = await ctx.http.delete(`/application/${createdAppId}`, {
        headers: ctx.getAuthHeaders('superAdmin'),
      });
      expect(res.data).toBeDefined();
      createdAppId = undefined;
    });
  });

  describe('Regular user (lambda)', () => {
    it('can list all applications', async () => {
      const res = await ctx.http.get('/application', {
        headers: ctx.getAuthHeaders('user1'),
      });
      // Accepte un tableau direct ou un objet { data: [...] }
      let arr;
      if (Array.isArray(res.data)) {
        arr = res.data;
      } else if (Array.isArray(res.data?.data)) {
        arr = res.data.data;
      } else {
        arr = null;
      }
      expect(Array.isArray(arr)).toBe(true);
    });

    it('cannot create an application', async () => {
      try {
        await ctx.http.post(
          '/application',
          {
            name: 'User App',
            iconMediaId,
          },
          { headers: ctx.getAuthHeaders('user1') },
        );
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        // Log la réponse pour debug
        // console.log('CREATE FAIL', err?.response?.status, err?.response?.data);
        expect(err?.response).toBeDefined();
        expect(err?.response?.status).not.toBe(200);
      }
    });

    it('cannot update an application', async () => {
      try {
        await ctx.http.patch(
          `/application/1`,
          { description: 'fail' },
          { headers: ctx.getAuthHeaders('user1') },
        );
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        // console.log('UPDATE FAIL', err?.response?.status, err?.response?.data);
        expect(err?.response).toBeDefined();
        expect(err?.response?.status).not.toBe(200);
      }
    });

    it('cannot delete an application', async () => {
      try {
        await ctx.http.delete(`/application/1`, {
          headers: ctx.getAuthHeaders('user1'),
        });
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        const status = err?.response?.status;
        expect([400, 401, 403].includes(Number(status))).toBe(true);
      }
    });

    it('cannot get application details', async () => {
      try {
        await ctx.http.get(`/application/1`, {
          headers: ctx.getAuthHeaders('user1'),
        });
        throw new Error('Request should have failed (forbidden)');
      } catch (err: any) {
        const status = err?.response?.status;
        expect([400, 401, 403].includes(Number(status))).toBe(true);
      }
    });
  });
});
