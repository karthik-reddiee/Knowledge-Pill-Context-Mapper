export interface InactivityThreshold {
  timeoutSeconds: number;
}

export class AgentMonitor {
  private isMonitoring: boolean = false;
  private lastActivityTime: number = 0;
  private inactivityTimeout: number = 300; // 5 minutes default
  private monitoringInterval: NodeJS.Timeout | undefined;

  constructor() {
    // Phase 7: Initialize inactivity detection
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }
    this.isMonitoring = true;
    this.lastActivityTime = Date.now();
    console.log('Agent monitoring started');
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    console.log('Agent monitoring stopped');
  }

  public updateActivityTime(): void {
    this.lastActivityTime = Date.now();
  }

  public getInactivityDuration(): number {
    return (Date.now() - this.lastActivityTime) / 1000;
  }

  public isInactive(): boolean {
    return this.getInactivityDuration() > this.inactivityTimeout;
  }

  public setInactivityTimeout(seconds: number): void {
    this.inactivityTimeout = seconds;
  }

  public getInactivityTimeout(): number {
    return this.inactivityTimeout;
  }

  public isActive(): boolean {
    return this.isMonitoring;
  }

  public dispose(): void {
    this.stopMonitoring();
  }
}
