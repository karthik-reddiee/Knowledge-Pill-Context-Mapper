import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Activity, ActivityLog } from '../models/Activity';
import { Logger } from '../utils/Logger';

export class StorageService {
  private logFilePath: string;
  private maxActivitiesInMemory: number = 1000;

  constructor(workspacePath: string) {
    this.logFilePath = path.join(workspacePath, 'activity-log.json');
  }

  public async loadActivityLog(): Promise<ActivityLog> {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const content = fs.readFileSync(this.logFilePath, 'utf-8');
        const log: ActivityLog = JSON.parse(content);
        return log;
      }
    } catch (error) {
      Logger.warn(`Failed to load activity log: ${error}`);
    }

    // Return empty log if file doesn't exist
    return {
      activities: [],
      startTime: new Date().toISOString(),
    };
  }

  public async appendActivity(activity: Activity): Promise<void> {
    try {
      let log = await this.loadActivityLog();

      // Add new activity
      log.activities.push(activity);

      // Trim if exceeds max to keep memory efficient
      if (log.activities.length > this.maxActivitiesInMemory) {
        const removeCount = log.activities.length - this.maxActivitiesInMemory;
        log.activities.splice(0, removeCount);
        Logger.debug(
          `Activity log trimmed, removed ${removeCount} old entries`
        );
      }

      // Update end time
      log.endTime = new Date().toISOString();

      // Write to file
      await this.saveActivityLog(log);
    } catch (error) {
      Logger.error(`Failed to append activity: ${error}`);
    }
  }

  public async saveActivityLog(log: ActivityLog): Promise<void> {
    try {
      const content = JSON.stringify(log, null, 2);
      fs.writeFileSync(this.logFilePath, content, 'utf-8');
    } catch (error) {
      Logger.error(`Failed to save activity log: ${error}`);
    }
  }

  public getLogFilePath(): string {
    return this.logFilePath;
  }

  public setMaxActivitiesInMemory(max: number): void {
    this.maxActivitiesInMemory = max;
  }
}
