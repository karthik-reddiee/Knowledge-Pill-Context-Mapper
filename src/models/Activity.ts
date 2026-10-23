export interface Activity {
  file: string;
  event: 'modified' | 'created' | 'deleted' | 'renamed';
  timestamp: string;
  preview?: string;
  oldPath?: string; // for rename events
}

export interface ActivityLog {
  activities: Activity[];
  startTime: string;
  endTime?: string;
}
