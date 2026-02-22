const perform = async (z, bundle) => {
  const options = {
    url: 'https://api.cartoncloud.com/uaa/userinfo',
    method: 'GET',
    headers: {
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
  };

  return z.request(options).then((response) => {
    // Extract tenants array and ensure each has an 'id' field
    const tenants = response.data.tenants || [];

    // Return array sorted alphabetically by name (for better UX in dropdown)
    return tenants.sort((a, b) => a.name.localeCompare(b.name));
  });
};

module.exports = {
  operation: { perform: perform },
  display: {
    description: 'Triggers when a new tenant is created. ',
    hidden: true,
    label: 'New Tenant',
  },
  key: 'new_tenant',
  noun: 'Tenant',
};
