import * as vscode from "vscode";
import { ConfigKey } from "../enums/configKey";
import { ConfigService } from "../services/configService";

/**
 * 状态栏管理器
 */
export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
    this.statusBarItem = this.createStatusBarItem();
  }

  /**
   * 创建状态栏项
   */
  private createStatusBarItem(): vscode.StatusBarItem {
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    const text = this.configService.getConfigValue<string>(ConfigKey.PREFERRED_STYLE) || "auto";
    statusBarItem.command = "SmartVariables.toggle";
    statusBarItem.tooltip = this.getTooltipText(text);
    statusBarItem.text = "$(edit-sparkle) 智能变量生成器";
    statusBarItem.show();
    return statusBarItem;
  }

  /**
   * 获取提示文本
   */
  private getTooltipText(text: string): string {
    return `当前已切换为${text}模式`;
  }

  /**
   * 设置加载状态
   */
  public setLoading(isLoading: boolean): void {
    this.statusBarItem.text = isLoading ? "$(loading~spin) 正在生成中..." : "$(edit-sparkle) 智能变量生成器";
  }

  /**
   * 更新状态栏提示
   */
  public updateTooltip(mode: string): void {
    const tooltipText = this.getTooltipText(mode === "auto" ? "自动" : "手动");
    this.statusBarItem.tooltip = tooltipText;
    vscode.window.setStatusBarMessage(tooltipText, 1500);
  }

  /**
   * 获取状态栏项
   */
  public getStatusBarItem(): vscode.StatusBarItem {
    return this.statusBarItem;
  }

  /**
   * 销毁状态栏项
   */
  public dispose(): void {
    this.statusBarItem.dispose();
  }
}