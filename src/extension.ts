import * as vscode from "vscode";
import { StatusBarManager } from "./ui/statusBarManager";
import { CommandManager } from "./commands/commandManager";

/**
 * 扩展激活函数
 */
export function activate(context: vscode.ExtensionContext): void {
  // 创建状态栏管理器
  const statusBarManager = new StatusBarManager();
  context.subscriptions.push(statusBarManager.getStatusBarItem());

  // 创建命令管理器
  const commandManager = new CommandManager(statusBarManager);

  // 注册命令
  const quickToggleCommand = commandManager.registerQuickToggleCommand();
  context.subscriptions.push(quickToggleCommand);

  const suggestCommand = commandManager.registerSuggestCommand();
  context.subscriptions.push(suggestCommand);
}

/**
 * 扩展停用函数
 */
export function deactivate(): void {
  // 清理资源
}