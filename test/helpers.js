const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

/**
 * Fetches a fresh access token using the session auth config.
 * Call this in beforeAll() and pass the token into each test bundle.
 */
const getAccessToken = async () => {
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

  return session.access_token;
};

/**
 * Returns a base authData object with credentials + a live access token.
 */
const getAuthData = async () => {
  const accessToken = await getAccessToken();
  return {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    access_token: accessToken,
  };
};

module.exports = { getAccessToken, getAuthData };
