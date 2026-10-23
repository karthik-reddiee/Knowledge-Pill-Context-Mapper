import * as vscode from 'vscode';
import { ActivityTracker } from './trackers/ActivityTracker';
import { TerminalTracker } from './trackers/TerminalTracker';
import { ProjectScanner } from './services/ProjectScanner';
import { AgentMonitor } from './services/AgentMonitor';
import { KnowledgeBuilder } from './services/KnowledgeBuilder';
import { ZipExporter } from './services/ZipExporter';
import { TerminalActivityIntegration } from './services/TerminalActivityIntegration';
import { ExportCommand } from './commands/ExportCommand';
import { ScanProjectCommand } from './commands/ScanProjectCommand';
import { StartTrackingCommand } from './commands/StartTrackingCommand';
import { StopTrackingCommand } from './commands/StopTrackingCommand';
import { StatusCommand } from './commands/StatusCommand';
import { GenerateKnowledgeCommand } from './commands/GenerateKnowledgeCommand';

let activityTracker: ActivityTracker;
let terminalTracker: TerminalTracker;
let projectScanner: ProjectScanner;
let agentMonitor: AgentMonitor;
let knowledgeBuilder: KnowledgeBuilder;
let zipExporter: ZipExporter;
let terminalActivityIntegration: TerminalActivityIntegration;
let scanProjectCommand: ScanProjectCommand;

export function activate(context: vscode.ExtensionContext) {
  const logger = new Logger();
  const knowledgeBuilder = new KnowledgeBuilder(logger);
  const generateKnowledgeCommand = new GenerateKnowledgeCommand(
    knowledgeBuilder,
    logger
  );

  generateKnowledgeCommand.register(context);

  console.log('Knowledge Pill extension is now active');

  // Initialize all services
  activityTracker = new ActivityTracker();
  terminalTracker = new TerminalTracker();
  projectScanner = new ProjectScanner();
  agentMonitor = new AgentMonitor();
  knowledgeBuilder = new KnowledgeBuilder();
  zipExporter = new ZipExporter();
  terminalActivityIntegration = new TerminalActivityIntegration(
    terminalTracker,
    agentMonitor
  );

  // Register commands
  const exportCommand = new ExportCommand(
    projectScanner,
    knowledgeBuilder,
    zipExporter
  );
  const scanProjectCommand = new ScanProjectCommand(projectScanner);
  const startTrackingCommand = new StartTrackingCommand(
    activityTracker,
    terminalTracker,
    agentMonitor
  );
  const stopTrackingCommand = new StopTrackingCommand(
    activityTracker,
    terminalTracker,
    agentMonitor
  );
  const statusCommand = new StatusCommand(
    activityTracker,
    terminalTracker,
    agentMonitor
  );

  // Subscribe commands to disposables
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'knowledge-pill.exportKnowledgePill',
      () => exportCommand.execute()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'knowledge-pill.scanProject',
      () => scanProjectCommand.execute()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'knowledge-pill.startTracking',
      () => startTrackingCommand.execute()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'knowledge-pill.stopTracking',
      () => stopTrackingCommand.execute()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('knowledge-pill.getStatus', () =>
      statusCommand.execute()
    )
  );

  // Start terminal activity integration
  terminalActivityIntegration.startMonitoring();

  vscode.window.showInformationMessage(
    'Knowledge Pill initialized. Use commands to start tracking.'
  );
}

export function deactivate() {
  console.log('Knowledge Pill extension is now deactivated');
  activityTracker?.dispose();
  terminalTracker?.dispose();
  agentMonitor?.dispose();
  terminalActivityIntegration?.dispose();
}
