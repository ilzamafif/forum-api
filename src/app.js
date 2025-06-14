/* eslint-disable no-console */
require('dotenv').config();
const createServer = require('./infrastructures/http/createServer');
const container = require('./infrastructures/container');

(async () => {
  const server = await createServer(container);
  await server.start();
  console.log(`server start at ${server.info.uri}`);
})();

