require('dotenv').config();
const { createApp } = require('./app');
const { config } = require('./config');

async function start() {
  const app = await createApp();
  app.listen(config.port, () => {
    console.log(`github-pr-analyzer-agent listening on port ${config.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
