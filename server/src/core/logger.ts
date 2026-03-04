import winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Human-readable format for development
const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, stack }) =>
        stack
            ? `[${ts}] ${level}: ${message}\n${stack}`
            : `[${ts}] ${level}: ${message}`
    )
);

// JSON format for production (e.g., ingest by Datadog/CloudWatch)
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(),
        // Persistent file logs in production
        ...(process.env.NODE_ENV === 'production'
            ? [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
            ]
            : []),
    ],
});

export default logger;
