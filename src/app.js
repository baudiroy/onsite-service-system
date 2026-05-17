const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { env } = require('./config/env');
const { requestId } = require('./middlewares/requestId');
const { requestLogger } = require('./middlewares/requestLogger');
const { notFoundHandler } = require('./middlewares/notFoundHandler');
const { errorHandler } = require('./middlewares/errorHandler');
const { router } = require('./routes');

const app = express();

app.disable('x-powered-by');
app.use(requestId);
app.use(requestLogger);
app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = Buffer.from(buf);
  }
}));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use(router);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app
};
