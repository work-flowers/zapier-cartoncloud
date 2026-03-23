const authentication = require('./authentication');
const newCustomerTrigger = require('./triggers/new_customer.js');
const newTenantTrigger = require('./triggers/new_tenant.js');
const createReportRunCreate = require('./creates/create_report_run.js');
const createOutboundOrderCreate = require('./creates/create_outbound_order.js');
const getOutboundOrderCreate = require('./creates/get_outbound_order.js');
const retrieveReportSearch = require('./searches/retrieve_report.js');
const getProductSearch = require('./searches/get_product.js');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication: authentication,
  requestTemplate: {
    headers: {
      'Accept-Version': '1',
      'X-CLIENT-ID': '{{bundle.authData.client_id}}',
      'X-CLIENT-SECRET': '{{bundle.authData.client_secret}}',
    },
    params: {
      client_id: '{{bundle.authData.client_id}}',
      client_secret: '{{bundle.authData.client_secret}}',
    },
  },
  creates: {
    [createReportRunCreate.key]: createReportRunCreate,
    [createOutboundOrderCreate.key]: createOutboundOrderCreate,
    [getOutboundOrderCreate.key]: getOutboundOrderCreate,
  },
  searches: {
    [retrieveReportSearch.key]: retrieveReportSearch,
    [getProductSearch.key]: getProductSearch,
  },
  triggers: {
    [newCustomerTrigger.key]: newCustomerTrigger,
    [newTenantTrigger.key]: newTenantTrigger,
  },
};
