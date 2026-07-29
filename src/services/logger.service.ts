export class LoggerService {
  private format(level: string, message: string): string {
    return `[${new Date().toISOString()}] [${level}] ${message}`;
  }

  info(message: string): void {
    console.log(this.format("INFO", message));
  }

  warn(message: string): void {
    console.warn(this.format("WARN", message));
  }

  error(message: string, error?: unknown): void {
    console.error(this.format("ERROR", message));
    if (error) {
      console.error(error);
    }
  }
}

export const logger = new LoggerService();
