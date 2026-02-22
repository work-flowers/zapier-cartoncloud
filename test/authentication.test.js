const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

describe('authentication', () => {
  it('should obtain a session token via client credentials', async () => {
    const bundle = {
      authData: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      },
    };

    const session = await appTester(
      App.authentication.sessionConfig.perform,
      bundle,
    );

    expect(session).toBeDefined();
    expect(session.access_token).toBeDefined();
    expect(typeof session.access_token).toBe('string');
    expect(session.access_token.length).toBeGreaterThan(0);
  });

  it('should pass the auth test with a valid token', async () => {
    const bundle = {
      authData: {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
      },
    };

    // First get a token
    const session = await appTester(
      App.authentication.sessionConfig.perform,
      bundle,
    );

    // Then test auth using that token
    const testBundle = {
      authData: {
        ...bundle.authData,
        access_token: session.access_token,
      },
    };

    const result = await appTester(App.authentication.test, testBundle);

    expect(result).toBeDefined();
    expect(result.tenants).toBeDefined();
    expect(Array.isArray(result.tenants)).toBe(true);
  });

  it('should fail with invalid credentials', async () => {
    const bundle = {
      authData: {
        client_id: 'invalid-client-id',
        client_secret: 'invalid-client-secret',
      },
    };

    await expect(
      appTester(App.authentication.sessionConfig.perform, bundle),
    ).rejects.toThrow();
  });
});
