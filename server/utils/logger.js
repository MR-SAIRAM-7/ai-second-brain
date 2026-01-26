/**
 * Simple logging utility for the application
 * Provides consistent logging format across the application
 */

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const formatMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

const logger = {
    info: (message, meta = {}) => {
        const formattedMsg = formatMessage('INFO', message, meta);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`${colors.blue}${formattedMsg}${colors.reset}`);
        } else {
            console.log(formattedMsg);
        }
    },

    success: (message, meta = {}) => {
        const formattedMsg = formatMessage('SUCCESS', message, meta);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`${colors.green}${formattedMsg}${colors.reset}`);
        } else {
            console.log(formattedMsg);
        }
    },

    warn: (message, meta = {}) => {
        const formattedMsg = formatMessage('WARN', message, meta);
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`${colors.yellow}${formattedMsg}${colors.reset}`);
        } else {
            console.warn(formattedMsg);
        }
    },

    error: (message, error = null, meta = {}) => {
        const errorMeta = error ? { 
            ...meta, 
            error: error.message, 
            stack: error.stack 
        } : meta;
        const formattedMsg = formatMessage('ERROR', message, errorMeta);
        
        if (process.env.NODE_ENV !== 'production') {
            console.error(`${colors.red}${formattedMsg}${colors.reset}`);
        } else {
            console.error(formattedMsg);
        }
    },

    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            const formattedMsg = formatMessage('DEBUG', message, meta);
            console.log(`${colors.dim}${formattedMsg}${colors.reset}`);
        }
    },

    http: (method, path, statusCode, duration) => {
        const formattedMsg = formatMessage('HTTP', `${method} ${path}`, {
            statusCode,
            duration: `${duration}ms`
        });
        
        let color = colors.reset;
        if (statusCode >= 500) color = colors.red;
        else if (statusCode >= 400) color = colors.yellow;
        else if (statusCode >= 300) color = colors.cyan;
        else if (statusCode >= 200) color = colors.green;

        if (process.env.NODE_ENV !== 'production') {
            console.log(`${color}${formattedMsg}${colors.reset}`);
        } else {
            console.log(formattedMsg);
        }
    }
};

module.exports = logger;
