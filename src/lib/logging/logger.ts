import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which logs to print based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add file transports only in non-serverless environments
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY;
if (!isServerless) {
  transports.push(
    // File transport for errors
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist (only in non-serverless environments)
import fs from 'fs';
if (!isServerless) {
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Add request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };
    
    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

// Add database query logging
export const dbLogger = {
  query: (query: string, params: any[], duration: number) => {
    logger.debug('Database Query', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params.length > 0 ? params : undefined,
      duration: `${duration}ms`,
    });
  },
  
  error: (error: any, query?: string) => {
    logger.error('Database Error', {
      error: error.message,
      query: query ? query.substring(0, 200) + (query.length > 200 ? '...' : '') : undefined,
      stack: error.stack,
    });
  },
};

// Add Twilio event logging
export const twilioLogger = {
  webhook: (event: string, data: any) => {
    logger.info('Twilio Webhook', {
      event,
      data: {
        callSid: data.CallSid,
        messageSid: data.MessageSid,
        taskSid: data.TaskSid,
        workerSid: data.WorkerSid,
        status: data.CallStatus || data.MessageStatus || data.TaskStatus,
      },
    });
  },
  
  error: (error: any, context: string) => {
    logger.error('Twilio Error', {
      context,
      error: error.message,
      stack: error.stack,
    });
  },
};

// Add QuickBase logging
export const quickbaseLogger = {
  api: (method: string, endpoint: string, status: number, duration: number) => {
    logger.info('QuickBase API', {
      method,
      endpoint,
      status,
      duration: `${duration}ms`,
    });
  },
  
  error: (error: any, context: string) => {
    logger.error('QuickBase Error', {
      context,
      error: error.message,
      stack: error.stack,
    });
  },
};

// Add cache logging
export const cacheLogger = {
  hit: (key: string) => {
    logger.debug('Cache Hit', { key });
  },
  
  miss: (key: string) => {
    logger.debug('Cache Miss', { key });
  },
  
  set: (key: string, ttl?: number) => {
    logger.debug('Cache Set', { key, ttl });
  },
  
  delete: (key: string) => {
    logger.debug('Cache Delete', { key });
  },
  
  error: (error: any, operation: string) => {
    logger.error('Cache Error', {
      operation,
      error: error.message,
    });
  },
};

// Add user action logging
export const userLogger = {
  login: (userId: string, email: string, ip: string) => {
    logger.info('User Login', { userId, email, ip });
  },
  
  logout: (userId: string, email: string) => {
    logger.info('User Logout', { userId, email });
  },
  
  action: (userId: string, action: string, details: any) => {
    logger.info('User Action', { userId, action, details });
  },
  
  error: (userId: string, error: any, context: string) => {
    logger.error('User Error', {
      userId,
      context,
      error: error.message,
      stack: error.stack,
    });
  },
};

// Add performance logging
export const performanceLogger = {
  api: (endpoint: string, method: string, duration: number, status: number) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger.log(level, 'API Performance', {
      endpoint,
      method,
      duration: `${duration}ms`,
      status,
    });
  },
  
  database: (operation: string, duration: number, recordCount?: number) => {
    const level = duration > 500 ? 'warn' : 'debug';
    logger.log(level, 'Database Performance', {
      operation,
      duration: `${duration}ms`,
      recordCount,
    });
  },
  
  cache: (operation: string, duration: number, hit: boolean) => {
    logger.debug('Cache Performance', {
      operation,
      duration: `${duration}ms`,
      hit,
    });
  },
  
  webhook: (type: string, duration: number, details?: any) => {
    const level = duration > 2000 ? 'warn' : 'info';
    logger.log(level, 'Webhook Performance', {
      type,
      duration: `${duration}ms`,
      ...details,
    });
  },
};

// Add security logging
export const securityLogger = {
  authFailure: (email: string, ip: string, reason: string) => {
    logger.warn('Authentication Failure', { email, ip, reason });
  },
  
  suspiciousActivity: (userId: string, activity: string, details: any) => {
    logger.warn('Suspicious Activity', { userId, activity, details });
  },
  
  accessDenied: (userId: string, resource: string, reason: string) => {
    logger.warn('Access Denied', { userId, resource, reason });
  },
};

// Add system logging
export const systemLogger = {
  startup: (message: string, details?: any) => {
    logger.info('System Startup', { message, details });
  },
  
  shutdown: (message: string, details?: any) => {
    logger.info('System Shutdown', { message, details });
  },
  
  health: (component: string, status: string, details?: any) => {
    logger.info('System Health', { component, status, details });
  },
  
  error: (component: string, error: any, details?: any) => {
    logger.error('System Error', {
      component,
      error: error.message,
      stack: error.stack,
      details,
    });
  },
};

// Export the main logger and specialized loggers
export { logger };

export default logger;
