import { E2EContext } from './e2e-utils';

describe('Dashboard Module (e2e) - super_admin', () => {
  const ctx = new E2EContext('http://localhost:3000');
  const superAdmin = {
    email: 'superadmin@dvara.local',
    password: 'superadmin123',
  };
  let dashboardId: number;
  let categoryId: number;
  let sectionId: number;
  let elementId: number;
  let appId: number;
  let contentAppId: number;
  let testAppId: number;

  beforeAll(async () => {
    await ctx.loginUser('superAdmin', superAdmin.email, superAdmin.password);
    // Retrieve the id of a known test application (e.g., 'App Test 1')
    const appRes = await ctx.http.get('/application', {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    const app = Array.isArray(appRes.data)
      ? appRes.data.find((a: any) => a.name === 'App Test 1')
      : (appRes.data.data || []).find((a: any) => a.name === 'App Test 1');
    if (!app) throw new Error('No test application found');
    testAppId = app.id;
  });

  afterAll(async () => {
    if (dashboardId) {
      try {
        await ctx.http.delete(`/dashboard/${dashboardId}`, {
          headers: ctx.getAuthHeaders('superAdmin'),
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('POST /dashboard - creates a dashboard', async () => {
    const res = await ctx.http.post(
      '/dashboard',
      { name: 'E2E Dashboard', public: true },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.id).toBeDefined();
    dashboardId = res.data.id;
  });

  it('GET /dashboard - lists all dashboards', async () => {
    const res = await ctx.http.get('/dashboard', {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('GET /dashboard/my - lists my dashboards', async () => {
    const res = await ctx.http.get('/dashboard/my', {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('GET /dashboard/:id - retrieves a dashboard', async () => {
    const res = await ctx.http.get(`/dashboard/${dashboardId}`, {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    expect(res.data.id).toBe(dashboardId);
  });

  it('PATCH /dashboard/:id - updates the dashboard', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}`,
      { name: 'E2E Dashboard Updated', pageTitle: 'E2E Title' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.name).toBe('E2E Dashboard Updated');
  });

  it('POST /dashboard/:id/category - adds a category', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/category`,
      { name: 'Category 1', order: 1 },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.id).toBeDefined();
    categoryId = res.data.id;
  });

  it('PATCH /dashboard/:id/category/:categoryId - updates the category', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/category/${categoryId}`,
      { name: 'Category Updated' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data).toBeDefined();
  });

  it('POST /dashboard/:id/section - adds a section', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/section`,
      { name: 'Section 1', order: 1 },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.id).toBeDefined();
    sectionId = res.data.id;
  });

  it('PATCH /dashboard/:id/section/:sectionId - updates the section', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/section/${sectionId}`,
      { name: 'Section Updated' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data).toBeDefined();
  });

  it('POST /dashboard/:id/element - adds an element', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/element`,
      { type: 'notepad', data: { text: 'note' }, order: 1 },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.id).toBeDefined();
    elementId = res.data.id;
  });

  it('PATCH /dashboard/:id/element/:elementId - updates an element', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/element/${elementId}`,
      { data: { text: 'note updated' } },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data).toBeDefined();
  });

  it('DELETE /dashboard/:id/element/:elementId - deletes an element', async () => {
    const res = await ctx.http.delete(
      `/dashboard/${dashboardId}/element/${elementId}`,
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.message).toBeDefined();
  });

  it('POST /dashboard/:id/application - adds a placeholder application', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/application`,
      { order: 1 },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.id).toBeDefined();
    contentAppId = res.data.id;
  });

  it('PATCH /dashboard/:id/application/:contentAppId - updates a placeholder application', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/application/${contentAppId}`,
      { size: 'large' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.size).toBe('large');
  });

  it('DELETE /dashboard/:id/application/:contentAppId - deletes a placeholder application', async () => {
    const res = await ctx.http.delete(
      `/dashboard/${dashboardId}/application/${contentAppId}`,
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.message).toBeDefined();
  });

  it('POST /dashboard/:id/category/:categoryId/application - adds an application to a category', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/category/${categoryId}/application`,
      { applicationId: testAppId },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.success).toBe(true);
    appId = res.data.data.id;
  });

  it('PATCH /dashboard/:id/category/:categoryId/application/:appId - updates a category application', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/category/${categoryId}/application/${appId}`,
      { size: 'small' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    const size = res.data.size || res.data.data?.size;
    expect(size).toBe('small');
  });

  it('DELETE /dashboard/:id/category/:categoryId/application/:appId - deletes a category application', async () => {
    const res = await ctx.http.delete(
      `/dashboard/${dashboardId}/category/${categoryId}/application/${appId}`,
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.message).toBeDefined();
  });

  it('DELETE /dashboard/:id/category/:categoryId - deletes a category', async () => {
    const res = await ctx.http.delete(
      `/dashboard/${dashboardId}/category/${categoryId}`,
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.message).toBeDefined();
  });

  it('POST /dashboard/:id/section/:sectionId/application - adds an application to a section', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/section/${sectionId}/application`,
      { applicationId: testAppId },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.id).toBeDefined();
    appId = res.data.id;
  });

  it('PATCH /dashboard/:id/section/:sectionId/application/:appId - updates a section application', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/section/${sectionId}/application/${appId}`,
      { size: 'medium' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    const size = res.data.size || res.data.data?.size;
    expect(size).toBe('medium');
  });

  it('DELETE /dashboard/:id/section/:sectionId/application/:appId - deletes a section application', async () => {
    const res = await ctx.http.delete(
      `/dashboard/${dashboardId}/section/${sectionId}/application/${appId}`,
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.message).toBeDefined();
  });

  it('DELETE /dashboard/:id/section/:sectionId - deletes a section', async () => {
    const res = await ctx.http.delete(
      `/dashboard/${dashboardId}/section/${sectionId}`,
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.message).toBeDefined();
  });

  it('PATCH /dashboard/:id/settings/general - updates general settings', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/general`,
      { pageTitle: 'General Title', metaTitle: 'Meta' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.settings.general.pageTitle).toBe('General Title');
  });

  it('PATCH /dashboard/:id/settings/layout - updates layout', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/layout`,
      { layouts: [{ name: 'default', breakpoint: 'md', columns: 8 }] },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.settings.layout.layouts).toBeDefined();
  });

  it('PATCH /dashboard/:id/settings/background - updates background', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/background`,
      { position: 'FIXED', size: 'COVER', repeat: 'NO_REPEAT' },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.settings.background.position).toBe('FIXED');
  });

  it('PATCH /dashboard/:id/settings/appearance - updates appearance', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/appearance`,
      {
        mainColor: '#000',
        secondaryColor: '#fff',
        iconColor: '#000',
        borderRadius: 'M',
      },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.settings.appearance.mainColor).toBe('#000');
  });

  it('PATCH /dashboard/:id/settings/access - updates access settings', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      { users: [], groups: [] },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(res.data.settings.access).toBeDefined();
  });

  it('DELETE /dashboard/:id - deletes the dashboard', async () => {
    const res = await ctx.http.delete(`/dashboard/${dashboardId}`, {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    expect(res.data).toBeDefined();
    dashboardId = 0;
  });
});

// Permissions tests

describe('Dashboard Permissions (e2e)', () => {
  const ctx = new E2EContext('http://localhost:3000');
  const superAdmin = {
    email: 'superadmin@dvara.local',
    password: 'superadmin123',
  };
  const lambdaUser = {
    email: 'user1@dvara.local',
    password: 'user1pass',
  };
  let dashboardId: number;
  let lambdaUserId: number;

  beforeAll(async () => {
    await ctx.loginUser('superAdmin', superAdmin.email, superAdmin.password);
    await ctx.loginUser('lambda', lambdaUser.email, lambdaUser.password);
    // Dynamically retrieve user1's id
    const usersRes = await ctx.http.get('/users', {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    const user = Array.isArray(usersRes.data)
      ? usersRes.data.find((u: any) => u.email === lambdaUser.email)
      : (usersRes.data.data || []).find(
          (u: any) => u.email === lambdaUser.email,
        );
    if (!user) throw new Error('User1 not found');
    lambdaUserId = user.id;
    // Create a temporary dashboard
    const res = await ctx.http.post(
      '/dashboard',
      { name: 'Dashboard Permissions Test', public: false },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    dashboardId = res.data.id;
  });

  afterAll(async () => {
    if (dashboardId) {
      try {
        await ctx.http.delete(`/dashboard/${dashboardId}`, {
          headers: ctx.getAuthHeaders('superAdmin'),
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('SuperAdmin grants view access to user1, user1 can view the dashboard', async () => {
    // Add user1 as VIEW
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      {
        users: [{ userId: lambdaUserId, permission: 'VIEW' }],
        groups: [],
      },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(
      res.data.settings.access.users.some(
        (u: any) => u.userId === lambdaUserId && u.permission === 'VIEW',
      ),
    ).toBe(true);
    // user1 can view the dashboard
    const res2 = await ctx.http.get(`/dashboard/${dashboardId}`, {
      headers: ctx.getAuthHeaders('lambda'),
    });
    expect(res2.data.id).toBe(dashboardId);
  });

  it('SuperAdmin upgrades user1 to edit, user1 can edit title and apps but not settings', async () => {
    // Upgrade to EDIT
    await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      {
        users: [{ userId: lambdaUserId, permission: 'EDIT' }],
        groups: [],
      },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    // Can edit the title
    const patchRes = await ctx.http.patch(
      `/dashboard/${dashboardId}`,
      { name: 'Lambda Edit' },
      { headers: ctx.getAuthHeaders('lambda') },
    );
    expect(patchRes.data.name).toBe('Lambda Edit');
    // Can add an app
    const appList = await ctx.http.get('/application', {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    const app = Array.isArray(appList.data)
      ? appList.data.find((a: any) => a.name === 'App Test 1')
      : (appList.data.data || []).find((a: any) => a.name === 'App Test 1');
    const addApp = await ctx.http.post(
      `/dashboard/${dashboardId}/application`,
      { applicationId: app.id, order: 1 },
      { headers: ctx.getAuthHeaders('lambda') },
    );
    expect(addApp.data.id).toBeDefined();
    // Cannot edit general settings
    try {
      await ctx.http.patch(
        `/dashboard/${dashboardId}/settings/general`,
        { pageTitle: 'HACK' },
        { headers: ctx.getAuthHeaders('lambda') },
      );
      expect(false).toBe(true); // Should not allow settings update
      return;
    } catch (err: any) {
      if (err?.name === 'JestAssertionError' || err?.matcherResult) throw err;
      if (err?.response?.status !== undefined) {
        expect([403, 400]).toContain(Number(err?.response?.status));
      } else {
        expect((err?.message || '').toLowerCase()).toMatch(
          /(forbidden|access|right|permission|unauthorized)/,
        );
      }
    }
  });

  it('SuperAdmin upgrades user1 to full_access, user1 can edit general settings but not access', async () => {
    // Upgrade to FULL_ACCESS
    await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      {
        users: [{ userId: lambdaUserId, permission: 'FULL_ACCESS' }],
        groups: [],
      },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    // Can edit general settings
    const patchSettings = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/general`,
      { pageTitle: 'Lambda FullAccess' },
      { headers: ctx.getAuthHeaders('lambda') },
    );
    expect(patchSettings.data.settings.general.pageTitle).toBe(
      'Lambda FullAccess',
    );
    // Cannot edit access settings
    try {
      await ctx.http.patch(
        `/dashboard/${dashboardId}/settings/access`,
        { users: [], groups: [] },
        { headers: ctx.getAuthHeaders('lambda') },
      );
      expect(false).toBe(true); // Should not allow access settings update
      return;
    } catch (err: any) {
      if (err?.name === 'JestAssertionError' || err?.matcherResult) throw err;
      if (err?.response?.status !== undefined) {
        expect([403, 400]).toContain(Number(err?.response?.status));
      } else {
        expect((err?.message || '').toLowerCase()).toMatch(
          /(forbidden|access|right|permission|unauthorized)/,
        );
      }
    }
  });
});

describe('Dashboard Permissions via Group (e2e)', () => {
  const ctx = new E2EContext('http://localhost:3000');
  const superAdmin = {
    email: 'superadmin@dvara.local',
    password: 'superadmin123',
  };
  const lambdaUser = {
    email: 'user1@dvara.local',
    password: 'user1pass',
  };
  let dashboardId: number;
  let testGroupId: number;

  beforeAll(async () => {
    await ctx.loginUser('superAdmin', superAdmin.email, superAdmin.password);
    await ctx.loginUser('lambda', lambdaUser.email, lambdaUser.password);
    // Retrieve the id of the group "Test Group 1"
    const groupRes = await ctx.http.get('/group', {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    const group = Array.isArray(groupRes.data)
      ? groupRes.data.find((g: any) => g.name === 'Test Group 1')
      : (groupRes.data.data || []).find((g: any) => g.name === 'Test Group 1');
    if (!group) throw new Error('Test Group 1 missing');
    testGroupId = group.id;
    // Create a temporary dashboard
    const res = await ctx.http.post(
      '/dashboard',
      { name: 'Dashboard Group Permissions Test', public: false },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    dashboardId = res.data.id;
  });

  afterAll(async () => {
    if (dashboardId) {
      try {
        await ctx.http.delete(`/dashboard/${dashboardId}`, {
          headers: ctx.getAuthHeaders('superAdmin'),
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  it('SuperAdmin grants view access to the group, user1 (member) can view the dashboard', async () => {
    // Add the group as VIEW
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      { users: [], groups: [{ groupId: testGroupId, permission: 'VIEW' }] },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    expect(
      res.data.settings.access.groups.some(
        (g: any) => g.groupId === testGroupId && g.permission === 'VIEW',
      ),
    ).toBe(true);
    // user1 can view the dashboard
    const res2 = await ctx.http.get(`/dashboard/${dashboardId}`, {
      headers: ctx.getAuthHeaders('lambda'),
    });
    expect(res2.data.id).toBe(dashboardId);
  });

  it('SuperAdmin upgrades the group to edit, user1 can edit title and apps but not settings', async () => {
    // Upgrade to EDIT
    await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      { users: [], groups: [{ groupId: testGroupId, permission: 'EDIT' }] },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    // Can edit the title
    const patchRes = await ctx.http.patch(
      `/dashboard/${dashboardId}`,
      { name: 'Group Lambda Edit' },
      { headers: ctx.getAuthHeaders('lambda') },
    );
    expect(patchRes.data.name).toBe('Group Lambda Edit');
    // Can add an app
    const appList = await ctx.http.get('/application', {
      headers: ctx.getAuthHeaders('superAdmin'),
    });
    const app = Array.isArray(appList.data)
      ? appList.data.find((a: any) => a.name === 'App Test 1')
      : (appList.data.data || []).find((a: any) => a.name === 'App Test 1');
    const addApp = await ctx.http.post(
      `/dashboard/${dashboardId}/application`,
      { applicationId: app.id, order: 1 },
      { headers: ctx.getAuthHeaders('lambda') },
    );
    expect(addApp.data.id).toBeDefined();
    // Cannot edit general settings
    try {
      await ctx.http.patch(
        `/dashboard/${dashboardId}/settings/general`,
        { pageTitle: 'HACK GROUP' },
        { headers: ctx.getAuthHeaders('lambda') },
      );
      expect(false).toBe(true); // Should not allow settings update
      return;
    } catch (err: any) {
      if (err?.name === 'JestAssertionError' || err?.matcherResult) throw err;
      if (err?.response?.status !== undefined) {
        expect([403, 400]).toContain(Number(err?.response?.status));
      } else {
        expect((err?.message || '').toLowerCase()).toMatch(
          /(forbidden|access|right|permission|unauthorized)/,
        );
      }
    }
  });

  it('SuperAdmin upgrades the group to full_access, user1 can edit general settings but not access', async () => {
    // Upgrade to FULL_ACCESS
    await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      {
        users: [],
        groups: [{ groupId: testGroupId, permission: 'FULL_ACCESS' }],
      },
      { headers: ctx.getAuthHeaders('superAdmin') },
    );
    // Can edit general settings
    const patchSettings = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/general`,
      { pageTitle: 'Group Lambda FullAccess' },
      { headers: ctx.getAuthHeaders('lambda') },
    );
    expect(patchSettings.data.settings.general.pageTitle).toBe(
      'Group Lambda FullAccess',
    );
    // Cannot edit access settings
    try {
      await ctx.http.patch(
        `/dashboard/${dashboardId}/settings/access`,
        { users: [], groups: [] },
        { headers: ctx.getAuthHeaders('lambda') },
      );
      expect(false).toBe(true); // Should not allow access settings update
      return;
    } catch (err: any) {
      if (err?.name === 'JestAssertionError' || err?.matcherResult) throw err;
      if (err?.response?.status !== undefined) {
        expect([403, 400]).toContain(Number(err?.response?.status));
      } else {
        expect((err?.message || '').toLowerCase()).toMatch(
          /(forbidden|access|right|permission|unauthorized)/,
        );
      }
    }
  });
});

// OWNER permissions

describe('Dashboard Permissions - OWNER', () => {
  const ctx = new E2EContext('http://localhost:3000');
  const owner = {
    email: 'user1@dvara.local',
    password: 'user1pass',
  };
  let dashboardId: number;

  beforeAll(async () => {
    await ctx.loginUser('owner', owner.email, owner.password);
    // Retrieve the id of a known test application
    const appRes = await ctx.http.get('/application', {
      headers: ctx.getAuthHeaders('owner'),
    });
    const app = Array.isArray(appRes.data)
      ? appRes.data.find((a: any) => a.name === 'App Test 1')
      : (appRes.data.data || []).find((a: any) => a.name === 'App Test 1');
    if (!app) throw new Error('No test application found');
    // Create a dashboard where owner is the owner
    const res = await ctx.http.post(
      '/dashboard',
      { name: 'Dashboard Owner Test', public: false },
      { headers: ctx.getAuthHeaders('owner') },
    );
    dashboardId = res.data.id;
  });

  afterAll(async () => {
    if (dashboardId) {
      try {
        await ctx.http.delete(`/dashboard/${dashboardId}`, {
          headers: ctx.getAuthHeaders('owner'),
        });
      } catch {
        /* ignore */
      }
    }
  });

  it('OWNER can access their dashboard', async () => {
    const res = await ctx.http.get(`/dashboard/${dashboardId}`, {
      headers: ctx.getAuthHeaders('owner'),
    });
    expect(res.data.id).toBe(dashboardId);
  });

  it('OWNER can update the dashboard', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}`,
      { name: 'Dashboard Owner Updated', pageTitle: 'Owner Title' },
      { headers: ctx.getAuthHeaders('owner') },
    );
    expect(res.data.name).toBe('Dashboard Owner Updated');
  });

  it('OWNER can add a category', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/category`,
      { name: 'Owner Category', order: 1 },
      { headers: ctx.getAuthHeaders('owner') },
    );
    expect(res.data.id).toBeDefined();
  });

  it('OWNER can add a section', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/section`,
      { name: 'Owner Section', order: 1 },
      { headers: ctx.getAuthHeaders('owner') },
    );
    expect(res.data.id).toBeDefined();
  });

  it('OWNER can add an element', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/element`,
      { type: 'notepad', data: { text: 'note' }, order: 1 },
      { headers: ctx.getAuthHeaders('owner') },
    );
    expect(res.data.id).toBeDefined();
  });

  it('OWNER can add an application', async () => {
    const res = await ctx.http.post(
      `/dashboard/${dashboardId}/application`,
      { order: 1 },
      { headers: ctx.getAuthHeaders('owner') },
    );
    expect(res.data.id).toBeDefined();
  });

  it('OWNER can update general settings', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/general`,
      { pageTitle: 'Owner Title', metaTitle: 'Owner Meta' },
      { headers: ctx.getAuthHeaders('owner') },
    );
    expect(res.data.settings.general.pageTitle).toBe('Owner Title');
  });

  it('OWNER can update access settings', async () => {
    const res = await ctx.http.patch(
      `/dashboard/${dashboardId}/settings/access`,
      { users: [], groups: [] },
      { headers: ctx.getAuthHeaders('owner') },
    );
    expect(res.data.settings.access).toBeDefined();
  });

  it('OWNER can delete the dashboard', async () => {
    const res = await ctx.http.delete(`/dashboard/${dashboardId}`, {
      headers: ctx.getAuthHeaders('owner'),
    });
    expect(res.data).toBeDefined();
    dashboardId = 0;
  });
});

// USER_LAMBDA (no access) permissions

describe('Dashboard Permissions - USER_LAMBDA (no access)', () => {
  const ctx = new E2EContext('http://localhost:3000');
  const lambdaUser = {
    email: 'user2@dvara.local',
    password: 'user2pass',
  };
  let dashboardId: number;
  beforeAll(async () => {
    // Create a dashboard with another user (owner)
    await ctx.loginUser('owner', 'user1@dvara.local', 'user1pass');
    const res = await ctx.http.post(
      '/dashboard',
      { name: 'Dashboard Lambda NoAccess', public: false },
      { headers: ctx.getAuthHeaders('owner') },
    );
    dashboardId = res.data.id;
    await ctx.loginUser('lambda', lambdaUser.email, lambdaUser.password);
  });
  afterAll(async () => {
    if (dashboardId) {
      await ctx.loginUser('owner', 'user1@dvara.local', 'user1pass');
      try {
        await ctx.http.delete(`/dashboard/${dashboardId}`, {
          headers: ctx.getAuthHeaders('owner'),
        });
      } catch {
        /* ignore */
      }
    }
  });
  const forbidden = async (fn: () => Promise<any>) => {
    try {
      await fn();
      expect(false).toBe(true); // Should never pass
    } catch (err: any) {
      if (err?.name === 'JestAssertionError' || err?.matcherResult) throw err;
      if (err?.response?.status !== undefined) {
        expect([403, 404]).toContain(Number(err?.response?.status));
      } else {
        expect((err?.message || '').toLowerCase()).toMatch(
          /(forbidden|access|right|permission|unauthorized|not found)/,
        );
      }
    }
  };
  it('USER_LAMBDA cannot access the dashboard', async () => {
    await forbidden(() =>
      ctx.http.get(`/dashboard/${dashboardId}`, {
        headers: ctx.getAuthHeaders('lambda'),
      }),
    );
  });
  it('USER_LAMBDA cannot update the dashboard', async () => {
    await forbidden(() =>
      ctx.http.patch(
        `/dashboard/${dashboardId}`,
        { name: 'Hack Lambda' },
        { headers: ctx.getAuthHeaders('lambda') },
      ),
    );
  });
  it('USER_LAMBDA cannot update settings', async () => {
    await forbidden(() =>
      ctx.http.patch(
        `/dashboard/${dashboardId}/settings/general`,
        { pageTitle: 'Hack Lambda' },
        { headers: ctx.getAuthHeaders('lambda') },
      ),
    );
    await forbidden(() =>
      ctx.http.patch(
        `/dashboard/${dashboardId}/settings/access`,
        { users: [], groups: [] },
        { headers: ctx.getAuthHeaders('lambda') },
      ),
    );
  });
  it('USER_LAMBDA cannot add a category', async () => {
    await forbidden(() =>
      ctx.http.post(
        `/dashboard/${dashboardId}/category`,
        { name: 'Lambda Category', order: 1 },
        { headers: ctx.getAuthHeaders('lambda') },
      ),
    );
  });
  it('USER_LAMBDA cannot add a section', async () => {
    await forbidden(() =>
      ctx.http.post(
        `/dashboard/${dashboardId}/section`,
        { name: 'Lambda Section', order: 1 },
        { headers: ctx.getAuthHeaders('lambda') },
      ),
    );
  });
  it('USER_LAMBDA cannot add an element', async () => {
    await forbidden(() =>
      ctx.http.post(
        `/dashboard/${dashboardId}/element`,
        { type: 'notepad', data: { text: 'hack' }, order: 1 },
        { headers: ctx.getAuthHeaders('lambda') },
      ),
    );
  });
  it('USER_LAMBDA cannot add an application', async () => {
    await forbidden(() =>
      ctx.http.post(
        `/dashboard/${dashboardId}/application`,
        { order: 1 },
        { headers: ctx.getAuthHeaders('lambda') },
      ),
    );
  });
  it('USER_LAMBDA cannot delete the dashboard', async () => {
    await forbidden(() =>
      ctx.http.delete(`/dashboard/${dashboardId}`, {
        headers: ctx.getAuthHeaders('lambda'),
      }),
    );
  });
});
