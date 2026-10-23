export class Logger {
  static info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  static warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  static error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }

  static debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }
}
