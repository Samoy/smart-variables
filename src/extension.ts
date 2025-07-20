import * as vscode from "vscode";
import OpenAI from "openai";
import { ConfigKey } from "./enums/configKey";
import { VarStyle } from "./enums/varStyle";

// 定义配置键常量
const CONFIG_SECTION = "SmartVariables";

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

export function activate(context: vscode.ExtensionContext) {
  const cmd = "SmartVariables.suggest";
  const disposable = vscode.commands.registerCommand(cmd, async () => {
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

    const style = await detectStyle();
    const prompt = buildPrompt(meaning, style);
    const statusMessage =
      vscode.window.setStatusBarMessage("正在生成变量名...");
    try {
      const candidates = await callLLM(prompt);
      statusMessage.dispose();
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
      editor.edit((e) => e.insert(editor.selection.active, selected));
    } catch (e) {
      vscode.window.showErrorMessage(
        `生成变量名失败：${e instanceof Error ? e.message : String(e)}`
      );
    }
  });

  context.subscriptions.push(disposable);
}

async function detectStyle() {
  // 1. 查找当前配置是自动模式还是手动模式
  const preferredStyle = getConfigValue<string>(ConfigKey.PREFERRED_STYLE);
  // 2. 如果是自动模式，则根据代码行内容判断变量命名风格
  if (preferredStyle === "auto") {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const doc = editor.document;
      const lang = doc.languageId;
      const line = doc.lineAt(editor.selection.active).text;
      return getVarStyleByLine(lang, line);
    }
  } else {
    const quickPickItems: vscode.QuickPickItem[] = VAR_STYLES.map((s) => ({
      label: s.id,
      description: s.desc,
      picked: s.id === preferredStyle,
    }));
    const style = await vscode.window.showQuickPick(quickPickItems);
    return style?.label as VarStyle;
  }
  // 默认返回小驼峰
  return VarStyle.Camel;
}

// 根据当前行内容推断变量风格
export function getVarStyleByLine(langugage: string, line: string): VarStyle {
  // FIXME: 这里可以根据实际需要实现更复杂的逻辑
  switch (langugage) {
    case "java": {
      // 静态常量通常为 UPPER_SNAKE_CASE
      if (/^\s*(public|private|protected)?\s*static\s+final\s+/.test(line)) {
        return VarStyle.Upper;
      }
      // 类名为 PascalCase
      if (
        /^\s*class\s+\w+/.test(line) ||
        /^\s*(public|private|protected)?\s*class\b/.test(line)
      ) {
        return VarStyle.Pascal;
      }
      return VarStyle.Camel;
    }
    case "python": {
      // 类名为 PascalCase
      if (/^\s*class\s+\w+/.test(line)) {
        return VarStyle.Pascal;
      }
      // 常量为 UPPER_SNAKE_CASE
      if (/^\s*[A-Z0-9_]+\s*=/.test(line)) {
        return VarStyle.Upper;
      }
      return VarStyle.Snake;
    }
    case "javascript":
    case "typescript": {
      // 检查是否为 const 声明且变量名为全大写
      if (/^\s*const\s+[A-Z0-9_]+\s*=/.test(line)) {
        return VarStyle.Upper;
      }
      // 检查是否为 const 声明
      if (/^\s*const\s+/.test(line)) {
        return VarStyle.Camel;
      }
      // 检查是否为类声明
      if (/^\s*class\s+\w+/.test(line)) {
        return VarStyle.Pascal;
      }
      return VarStyle.Camel;
    }
    default:
      return VarStyle.Camel;
  }
}

// 通用配置读取函数
function getConfigValue<T>(key: string): T | undefined {
  const cfg = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return cfg.get<T>(key);
}

function buildPrompt(meaning: string, style: VarStyle, count: number = 6) {
  return `
  输入含义：${meaning}
  要求：
  1. 生成 ${count} 个符合 ${style} 风格、语义准确的变量名。
  2. 一行一个，不要编号，不要解释。
  3. 优先简短、无歧义，可含常见缩写。
  4. 一个单词也可作为变量名。
  `.trim();
  return "";
}

export async function callLLM(prompt: string): Promise<string[]> {
  const apiKey = getConfigValue<string>(ConfigKey.API_KEY);
  if (!apiKey) {
    throw new Error(
      "API 密钥未设置，请在设置中配置 " +
        CONFIG_SECTION +
        "." +
        ConfigKey.API_KEY
    );
  }
  const baseUrl = getConfigValue<string>(ConfigKey.BASE_URL);
  const openai = new OpenAI({ apiKey });
  if (baseUrl) {
    openai.baseURL = baseUrl;
  }
  const modelId = getConfigValue<string>(ConfigKey.MODEL_ID);
  if (!modelId) {
    throw new Error(
      "模型未设置，请在设置中配置 " + CONFIG_SECTION + "." + ConfigKey.MODEL_ID
    );
  }
  try {
    const res = await openai.chat.completions.create({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 200,
    });
    const content = res?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("未能获取到有效的响应内容");
    }
    // 按换行拆，过滤空串
    return content
      .trim()
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);
  } catch (error) {
    // 处理网络错误和其他异常
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`API 请求失败：${errorMessage}`);
  }
}
