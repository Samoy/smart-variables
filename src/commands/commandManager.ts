import * as vscode from "vscode";
import { VarStyle } from "../enums/varStyle";
import { ConfigKey } from "../enums/configKey";
import { ConfigService } from "../services/configService";
import { StyleDetector } from "../services/styleDetector";
import { LLMService } from "../services/llmService";
import { StatusBarManager } from "../ui/statusBarManager";

// 变量风格列表
const VAR_STYLES: { id: VarStyle; desc: string }[] = [
  {
    id: VarStyle.Camel,
    desc: "小驼峰，如 myVariableName，常用于JavaScript、Java等语言的方法、属性名、局部变量等。",
  },
  {
    id: VarStyle.Pascal,
    desc: "大驼峰，如 MyVariableName，常用于类名、构造函数等。",
  },
  {
    id: VarStyle.Snake,
    desc: "蛇形命名法，如 my_variable_name，常用于Python、C等语言的变量名、函数名等。",
  },
  {
    id: VarStyle.Upper,
    desc: "全大写蛇形命名法，如 MY_VARIABLE_NAME，常用于常量、宏定义等。",
  },
];

/**
 * 命令管理器
 */
export class CommandManager {
  accessor configService: ConfigService;
  accessor styleDetector: StyleDetector;
  accessor llmService: LLMService;
  accessor statusBarManager: StatusBarManager;

  constructor(statusBarManager: StatusBarManager) {
    this.configService = new ConfigService();
    this.styleDetector = new StyleDetector();
    this.llmService = new LLMService();
    this.statusBarManager = statusBarManager;
  }

  /**
   * 注册快速切换命令
   */
  public registerQuickToggleCommand(): vscode.Disposable {
    const toggleCmd = "SmartVariables.toggle";
    return vscode.commands.registerCommand(toggleCmd, async () => {
      // 每次点击按钮时重新获取最新的配置值
      const currentStyle = this.configService.getConfigValue<string>(
        ConfigKey.PREFERRED_STYLE
      );
      const newStyle = currentStyle === "auto" ? "ask" : "auto";

      await this.configService.updateConfigValue(
        ConfigKey.PREFERRED_STYLE,
        newStyle,
        vscode.ConfigurationTarget.Global
      );

      this.statusBarManager.updateTooltip(newStyle);
    });
  }

  /**
   * 注册变量建议命令
   */
  public registerSuggestCommand(): vscode.Disposable {
    const suggestCmd = "SmartVariables.suggest";
    return vscode.commands.registerCommand(suggestCmd, async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const meaning = await vscode.window.showInputBox({
        prompt: "输入变量含义（中/英）",
        placeHolder: "例如：用户列表",
      });

      if (!meaning || !meaning.trim()) {
        return;
      }

      try {
        const style = await this.detectStyle();
        this.statusBarManager.setLoading(true);

        // 获取上下文信息
        const context = {
          language: editor.document.languageId,
          currentLine: editor.document.lineAt(editor.selection.active.line)
            .text,
        };

        const candidates = await this.llmService.generateVariableNames(
          meaning,
          style,
          6,
          context
        );
        this.statusBarManager.setLoading(false);

        if (candidates.length === 0) {
          vscode.window.showErrorMessage("未生成任何变量名");
          return;
        }

        const selected = await vscode.window.showQuickPick(candidates, {
          placeHolder: "选择最满意的变量名 ⏎ 插入",
        });

        if (!selected) {
          return;
        }

        editor.edit((editBuilder) =>
          editBuilder.insert(editor.selection.active, selected)
        );
      } catch (error) {
        this.statusBarManager.setLoading(false);
        vscode.window.showErrorMessage(
          `生成变量名失败：${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
  }

  /**
   * 检测当前变量命名风格
   */
  async detectStyle(): Promise<VarStyle> {
    // 1. 查找当前配置是自动模式还是手动模式
    const preferredStyle = this.configService.getConfigValue<string>(
      ConfigKey.PREFERRED_STYLE
    );

    // 2. 如果是自动模式，则根据代码行内容判断变量命名风格
    if (preferredStyle === "auto") {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const doc = editor.document;
        const lang = doc.languageId;
        const line = doc.lineAt(editor.selection.active).text;
        return this.styleDetector.getVarStyleByLine(lang, line);
      }
    } else {
      // 3. 如果是手动模式，则弹出选择框让用户选择
      const quickPickItems: vscode.QuickPickItem[] = VAR_STYLES.map((s) => ({
        label: s.id,
        description: s.desc,
        picked: s.id === preferredStyle,
      }));

      const style = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: "选择变量命名风格",
        ignoreFocusOut: true, // 防止用户意外点击外部关闭
      });

      // 处理用户取消选择的情况
      if (!style) {
        vscode.window.showWarningMessage(
          "未选择变量风格，将使用默认风格（小驼峰）"
        );
        return VarStyle.Camel;
      }

      return style.label as VarStyle;
    }

    // 默认返回小驼峰
    return VarStyle.Camel;
  }
}
