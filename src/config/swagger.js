const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load(process.env.SWAGGER_DOCS_PATH || './docs/swagger.yaml');

module.exports = {
  swaggerUi,
  swaggerDocument,
}; 