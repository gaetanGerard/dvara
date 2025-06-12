import { E2EContext } from './e2e-utils';

describe('Auth E2E - Login, Refresh, Logout', () => {
  const ctx = new E2EContext('http://localhost:3000');

  const users = [
    {
      label: 'super_admin',
      email: 'superadmin@dvara.local',
      password: 'superadmin123',
    },
    {
      label: 'user1',
      email: 'user1@dvara.local',
      password: 'user1pass',
    },
  ];

  users.forEach(({ label, email, password }) => {
    describe(`${label} authentication`, () => {
      let accessToken: string;
      let refreshToken: string;

      it('can login and receive tokens', async () => {
        const res = await ctx.http.post('/auth/login', { email, password });
        expect(res.data.access_token).toBeDefined();
        expect(res.data.refresh_token).toBeDefined();
        accessToken = res.data.access_token;
        refreshToken = res.data.refresh_token;
      });

      it('can refresh the access token', async () => {
        const res = await ctx.http.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        expect(res.data.access_token).toBeDefined();
        // Do not expect a new refresh_token, only access_token is returned
        accessToken = res.data.access_token;
      });

      it('can logout (revoke refresh token)', async () => {
        const res = await ctx.http.post(
          '/auth/logout',
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        expect(res.data.message).toBe('Successfully logged out.');
      });

      it('cannot refresh with revoked token', async () => {
        try {
          await ctx.http.post('/auth/refresh', { refresh_token: refreshToken });
          throw new Error('Refresh should have failed after logout');
        } catch (err: any) {
          const status = err?.response?.status;
          expect(status === 401 || status === 400).toBe(true);
        }
      });
    });
  });
});
