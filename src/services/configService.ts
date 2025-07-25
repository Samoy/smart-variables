import * as vscode from "vscode";

// 定义配置键常量
const CONFIG_SECTION = "SmartVariables";

/**
 * 配置服务
 */
export class ConfigService {
  /**
   * 通用配置读取函数
   */
  public getConfigValue<T>(key: string): T | undefined {
    const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return cfg.get<T>(key);
  }

  /**
   * 更新配置值
   */
  public async updateConfigValue(
    key: string, 
    value: unknown, 
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    await vscode.workspace
      .getConfiguration(CONFIG_SECTION)
      .update(key, value, target);
  }

  /**
   * 获取配置段名称
   */
  public getConfigSection(): string {
    return CONFIG_SECTION;
  }
}