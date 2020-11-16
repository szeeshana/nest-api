import * as dotenv from 'dotenv';
export class ConfigService {
  constructor() {
    const nodeEnv = this.nodeEnv;
    dotenv.config({
      path: `.${nodeEnv}.env`,
    });
    // Replace \\n with \n to support multiline strings in AWS
    for (const envName of Object.keys(process.env)) {
      process.env[envName] = process.env[envName].replace(/\\n/g, '\n');
    }
  }
  public get(key: string): string {
    return process.env[key];
  }
  public getNumber(key: string): number {
    return Number(this.get(key));
  }
  public getBoolean(key: string): boolean {
    return this.get(key) === 'false' ? false : true;
  }
  get nodeEnv(): string {
    return this.get('NODE_ENV') || 'development';
  }
}
