import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Attempt to load .env file
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (e) {
  // Ignore error if dotenv is not available, assume env vars are set
}

// Configuration Interface
export interface Config {
  env: string;
  trading: {
    dryRun: boolean;
    maxPositionSize: number; // Percentage
    stopLossPercent: number; // Percentage
    dailyLossLimit: number; // Absolute value
  };
  data: {
    yahooFinanceApiKey?: string;
    twitterApiKey?: string;
    twitterApiSecret?: string;
  };
  memory: {
    storagePath: string;
    maxCacheSize: number;
    indexRefreshInterval: number; // ms
  };
  logging: {
    level: string;
    dir: string;
  };
  stockRich: {
    baseDir: string;
    dailyDataDir: string;
  };
}

const getEnv = (key: string, defaultValue?: string): string => {
  const val = process.env[key];
  if (val === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const val = process.env[key];
  if (val === undefined || val === '') {
    return defaultValue;
  }
  const parsed = Number(val);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable ${key}: ${val}`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const val = process.env[key];
  if (val === undefined || val === '') {
    return defaultValue;
  }
  return val.toLowerCase() === 'true' || val === '1';
};

const stockRichBaseDir = path.resolve(process.cwd(), getEnv('STOCK_RICH_PATH', 'src/stock_rich'));

export const config: Config = {
  env: getEnv('NODE_ENV', 'development'),
  trading: {
    dryRun: getEnvBoolean('TRADING_DRY_RUN', true),
    maxPositionSize: getEnvNumber('TRADING_MAX_POSITION_SIZE', 5),
    stopLossPercent: getEnvNumber('TRADING_STOP_LOSS_PERCENT', 5),
    dailyLossLimit: getEnvNumber('TRADING_DAILY_LOSS_LIMIT', 1000),
  },
  data: {
    yahooFinanceApiKey: process.env.YAHOO_FINANCE_API_KEY,
    twitterApiKey: process.env.TWITTER_API_KEY,
    twitterApiSecret: process.env.TWITTER_API_SECRET,
  },
  memory: {
    storagePath: path.resolve(process.cwd(), getEnv('MEMORY_STORAGE_PATH', './data/memory')),
    maxCacheSize: getEnvNumber('MEMORY_MAX_CACHE_SIZE', 1000),
    indexRefreshInterval: getEnvNumber('MEMORY_INDEX_REFRESH_INTERVAL', 3600000),
  },
  logging: {
    level: getEnv('LOG_LEVEL', 'info'),
    dir: path.resolve(process.cwd(), getEnv('LOG_DIR', './logs')),
  },
  stockRich: {
    baseDir: stockRichBaseDir,
    dailyDataDir: path.join(stockRichBaseDir, 'data', 'daily'),
  },
};

/**
 * Validates the configuration.
 * Throws an error if critical configuration is missing or invalid.
 */
export function validateConfig(): void {
  if (config.trading.maxPositionSize <= 0 || config.trading.maxPositionSize > 100) {
    throw new Error('TRADING_MAX_POSITION_SIZE must be between 0 and 100');
  }
  
  if (config.trading.stopLossPercent <= 0 || config.trading.stopLossPercent > 100) {
    throw new Error('TRADING_STOP_LOSS_PERCENT must be between 0 and 100');
  }

  // Ensure directories exist or are creatable
  try {
      if (!fs.existsSync(config.logging.dir)) {
          fs.mkdirSync(config.logging.dir, { recursive: true });
      }
      // We don't necessarily create stockRich dirs here as they might be managed by stock_rich module
      // But we can check if baseDir exists if it's expected to be pre-existing
  } catch (e) {
      console.warn(`Warning: Could not create logging directory: ${e}`);
  }
}
