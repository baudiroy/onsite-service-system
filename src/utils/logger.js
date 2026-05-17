const LEVELS = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
});

const configuredLevel = process.env.LOG_LEVEL || 'info';
const minimumLevel = LEVELS[configuredLevel] || LEVELS.info;

function serializeError(error) {
  if (!error) {
    return undefined;
  }

  return {
    name: error.name,
    message: error.message,
    code: error.code
  };
}

function writeLog(level, message, context = {}) {
  if (LEVELS[level] < minimumLevel) {
    return;
  }

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context
  };

  if (entry.error instanceof Error) {
    entry.error = serializeError(entry.error);
  }

  const line = JSON.stringify(entry);

  if (level === 'error') {
    console.error(line);
    return;
  }

  console.log(line);
}

const logger = {
  debug(message, context) {
    writeLog('debug', message, context);
  },
  info(message, context) {
    writeLog('info', message, context);
  },
  warn(message, context) {
    writeLog('warn', message, context);
  },
  error(message, context) {
    writeLog('error', message, context);
  }
};

module.exports = {
  logger
};
