import fs from 'fs';
import path from 'path';

/**
 * Utility for managing daily data storage.
 * Paths are structured as: baseDir/YYYY-MM-DD/filename
 */
export class DailyStorage {
  private baseDir: string;

  constructor(baseDir: string = 'src/stock_rich/data/daily') {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  /**
   * Get the directory path for a specific date.
   * If date is not provided, uses today's date (local time).
   */
  getDailyDir(date?: Date | string): string {
    let d: Date;
    if (typeof date === 'string') {
        d = new Date(date);
    } else if (date instanceof Date) {
        d = date;
    } else {
        d = new Date();
    }

    if (isNaN(d.getTime())) {
      throw new Error(`Invalid date provided: ${date}`);
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return path.join(this.baseDir, dateStr);
  }

  /**
   * Get the full file path for a specific date and filename.
   */
  getFilePath(filename: string, date?: Date | string): string {
    const dir = this.getDailyDir(date);
    return path.join(dir, filename);
  }

  /**
   * Ensure the directory for the given date exists.
   */
  ensureDailyDir(date?: Date | string): string {
    const dir = this.getDailyDir(date);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Write data to a JSON file in the daily directory.
   */
  saveData(filename: string, data: any, date?: Date | string): string {
    const dir = this.ensureDailyDir(date);
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return filePath;
  }

  /**
   * Read data from a JSON file in the daily directory.
   * Returns null if file does not exist.
   */
  readData<T>(filename: string, date?: Date | string): T | null {
    const filePath = this.getFilePath(filename, date);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(`Error parsing JSON from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * List all files in the daily directory.
   */
  listFiles(date?: Date | string): string[] {
    const dir = this.getDailyDir(date);
    if (!fs.existsSync(dir)) {
      return [];
    }
    return fs.readdirSync(dir);
  }
}

export const dailyStorage = new DailyStorage();
