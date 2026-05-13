const perform = async (z, bundle) => {
  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/warehouse-products/${bundle.inputData.product_id}`,
    method: 'GET',
    headers: {
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
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

    return [results];
  });
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'tenant_id',
        label: 'Tenant ID',
        type: 'string',
        helpText: 'CartonCloud tenant ID (UUID) the product belongs to.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'product_id',
        label: 'Product ID',
        type: 'string',
        helpText:
          'CartonCloud internal product ID (UUID). This is NOT the SKU / product_code string used on orders — it is the system-assigned UUID returned by product list endpoints or order line items.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Fetches the full record of a single product by its CartonCloud internal product ID (UUID), including SKU/product_code, name, dimensions, weight, and other attributes. Requires tenant_id and product_id. Use to resolve a product UUID (e.g. from an order line item) into its human-readable details. Note: this lookup takes the UUID, not the SKU.',
    hidden: false,
    label: 'Get Product',
  },
  key: 'get_product',
  noun: 'Product',
};
