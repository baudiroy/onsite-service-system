const { app } = require('./app');
const { env } = require('./config/env');
const { pool } = require('./db/pool');

const server = app.listen(env.port, () => {
  console.log(`onsite-service-api listening on port ${env.port}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down HTTP server.`);

  server.close(async () => {
    try {
      await pool.end();
      console.log('PostgreSQL pool closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error while closing PostgreSQL pool', {
        message: error.message
      });
      process.exit(1);
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
