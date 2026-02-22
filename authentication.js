const test = async (z, bundle) => {
  const options = {
    url: 'https://api.cartoncloud.com/uaa/userinfo',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${bundle.authData.access_token}`,
      'Accept-Version': '1',
    },
    params: {},
    removeMissingValuesFrom: {
      body: false,
      params: false,
    },
  };

  return z.request(options).then((response) => {
    const results = response.json;

    // You can do any parsing you need for results here before returning them

    return results;
  });
};

const perform = async (z, bundle) => {
  const authString = Buffer.from(
    `${bundle.authData.client_id}:${bundle.authData.client_secret}`,
    'utf8',
  ).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  }).toString();

  const response = await z.request({
    url: 'https://api.cartoncloud.com/uaa/oauth/token',
    method: 'POST',
    headers: {
      'Accept-Version': '1',
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${authString}`,
    },
    body,
  });

  if (response.status >= 400) {
    // Helpful error when auth fails
    throw new z.errors.Error(
      `Token request failed (${response.status}): ${response.content}`,
      'AuthenticationError',
      response.status,
    );
  }

  const results = response.json;

  // Returned object is merged into bundle.authData for subsequent requests
  return {
    access_token: results.access_token,
    // optionally keep these if returned by the API:
    expires_in: results.expires_in,
    token_type: results.token_type,
  };
};

module.exports = {
  type: 'session',
  test: test,
  fields: [
    {
      computed: false,
      key: 'client_id',
      required: true,
      label: 'Client ID',
      type: 'password',
    },
    {
      computed: false,
      key: 'client_secret',
      required: true,
      label: 'Client Secret',
      type: 'password',
    },
  ],
  sessionConfig: { perform: perform },
  connectionLabel: '',
};
