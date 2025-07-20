import * as vscode from "vscode";
import axios from "axios";

enum VarStyle {
  Camel = "camelCase",
  Snake = "snake_case",
  Pascal = "PascalCase",
  Upper = "UPPER_SNAKE_CASE",
  Hungarian = "Hungarian",
}

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

    const style = detectStyle();
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

function detectStyle(): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return "camel";
  }
  const doc = editor.document;
  const lang = doc.languageId;
  const line = doc.lineAt(editor.selection.active).text;

  // 1) 用户强制设置
  const cfg = vscode.workspace.getConfiguration("SmartVariables");
  const preferredStyle = cfg.get<string>("preferredStyle");
  if (preferredStyle && preferredStyle !== "auto") {
    return preferredStyle;
  }

  // 2) 按语言 + 上下文推断
  switch (lang) {
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

function getKey() {
  const cfg = vscode.workspace.getConfiguration("SmartVariables");
  return cfg.get<string>("apiKey");
}

async function callLLM(prompt: string): Promise<string[]> {
  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 200,
    },
    { headers: { Authorization: `Bearer ${getKey()}` } }
  );

  // 按换行拆，过滤空串
  return res.data.choices[0].message.content
    .trim()
    .split("\n")
    .map((s: string) => s.trim())
    .filter(Boolean);
}

function buildPrompt(
  meaning: string,
  style: string,
  count: number = 6
): string {
  const label = {
    [VarStyle.Camel]: "camelCase",
    [VarStyle.Snake]: "snake_case",
    [VarStyle.Pascal]: "PascalCase",
    [VarStyle.Upper]: "UPPER_SNAKE_CASE",
  }[style];
  return `
输入含义：${meaning}
要求：
1. 生成 ${count} 个符合 ${label} 风格、语义准确的变量名。
2. 一行一个，不要编号，不要解释。
3. 优先简短、无歧义，可含常见缩写。
4. 一个单词也可作为变量名。
`.trim();
}
