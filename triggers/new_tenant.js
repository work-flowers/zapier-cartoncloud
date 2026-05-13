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
    description:
      'Lists all CartonCloud tenants (warehouse organisations) the authenticated user has access to. Use to discover available tenant IDs before calling any other tool — every other tool in this integration requires a tenant_id. Returns an array of tenants with id and name.',
    hidden: true,
    label: 'New Tenant',
  },
  key: 'new_tenant',
  noun: 'Tenant',
};
