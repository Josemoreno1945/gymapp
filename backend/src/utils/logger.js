// ============================================================
// Logger Utility — Structured console logging
// ============================================================

const COLORS = {
  reset: '\x1b[0m',
  cyan:  '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red:   '\x1b[31m',
  gray:  '\x1b[90m',
  magenta: '\x1b[35m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export const logger = {
  info(msg, ...args) {
    console.log(`${COLORS.gray}[${timestamp()}]${COLORS.cyan} [INFO]${COLORS.reset} ${msg}`, ...args);
  },

  success(msg, ...args) {
    console.log(`${COLORS.gray}[${timestamp()}]${COLORS.green} [OK]${COLORS.reset} ${msg}`, ...args);
  },

  warn(msg, ...args) {
    console.warn(`${COLORS.gray}[${timestamp()}]${COLORS.yellow} [WARN]${COLORS.reset} ${msg}`, ...args);
  },

  error(msg, ...args) {
    console.error(`${COLORS.gray}[${timestamp()}]${COLORS.red} [ERROR]${COLORS.reset} ${msg}`, ...args);
  },

  debug(msg, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${COLORS.gray}[${timestamp()}]${COLORS.magenta} [DEBUG]${COLORS.reset} ${msg}`, ...args);
    }
  },

  request(method, path, statusCode, durationMs) {
    const color = statusCode >= 400 ? COLORS.red : statusCode >= 300 ? COLORS.yellow : COLORS.green;
    console.log(
      `${COLORS.gray}[${timestamp()}]${COLORS.reset} ${method.padEnd(6)} ${path} ${color}${statusCode}${COLORS.reset} ${COLORS.gray}${durationMs}ms${COLORS.reset}`
    );
  },
};

/**
 * Express middleware: logs every request with duration.
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });

  next();
}

export default logger;
