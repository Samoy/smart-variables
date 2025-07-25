import * as vscode from "vscode";
import { VarStyle } from "../enums/varStyle";
import { CodeContext } from "../types/context";
import { ContextAnalyzer } from "./contextAnalyzer";

/**
 * 变量风格检测器
 */
export class StyleDetector {
  private contextAnalyzer: ContextAnalyzer;

  constructor() {
    this.contextAnalyzer = new ContextAnalyzer();
  }

  /**
   * 根据当前上下文智能推断变量风格
   */
  public getVarStyleByLine(language: string, line: string): VarStyle {
    // 1. 首先检查当前行的特定模式（不依赖编辑器）
    const currentLineStyle = this.analyzeCurrentLine(line, language);
    if (currentLineStyle) {
      return currentLineStyle;
    }

    // 2. 如果有活动编辑器，则进行上下文分析
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const currentLineNumber = editor.selection.active.line;
      
      // 获取上下文信息
      const context = this.contextAnalyzer.analyzeContext(document, currentLineNumber, language);
      
      // 根据语言和上下文推断风格
      return this.inferStyleFromContext(language, line, context);
    }

    // 3. 最后使用语言默认风格
    return this.getDefaultStyleByLanguage(language);
  }

  /**
   * 根据上下文推断变量风格
   */
  private inferStyleFromContext(language: string, currentLine: string, context: CodeContext): VarStyle {
    // 1. 首先检查当前行的特定模式
    const currentLineStyle = this.analyzeCurrentLine(currentLine, language);
    if (currentLineStyle) {
      return currentLineStyle;
    }
    
    // 2. 根据代码结构上下文推断
    if (context.isTypeDefinition || context.isInInterface || 
        (context.isInClass && this.isClassMemberDefinition(currentLine, language))) {
      return VarStyle.Pascal;
    }
    
    if (context.isConstantContext || context.isInEnum) {
      return VarStyle.Upper;
    }
    
    // 3. 根据现有变量的风格推断（取最常见的风格）
    if (context.existingVariables.length > 0) {
      const styleCount = new Map<VarStyle, number>();
      context.existingVariables.forEach(v => {
        styleCount.set(v.style, (styleCount.get(v.style) || 0) + 1);
      });
      
      let maxCount = 0;
      let dominantStyle = this.getDefaultStyleByLanguage(language);
      for (const [style, count] of styleCount) {
        if (count > maxCount) {
          maxCount = count;
          dominantStyle = style;
        }
      }
      
      // 如果有明显的主导风格（超过50%），则使用该风格
      if (maxCount > context.existingVariables.length * 0.5) {
        return dominantStyle;
      }
    }
    
    // 4. 使用语言默认风格
    return this.getDefaultStyleByLanguage(language);
  }

  /**
   * 分析当前行的特定模式
   */
  private analyzeCurrentLine(line: string, language: string): VarStyle | null {
    const trimmedLine = line.trim();
    
    switch (language) {
      case "java":
        // 静态常量
        if (/^\s*(public|private|protected)?\s*static\s+final\s+/.test(line)) {
          return VarStyle.Upper;
        }
        // 类定义
        if (/^\s*(public|private|protected)?\s*(abstract\s+)?class\s+/.test(line)) {
          return VarStyle.Pascal;
        }
        // 接口定义
        if (/^\s*(public|private|protected)?\s*interface\s+/.test(line)) {
          return VarStyle.Pascal;
        }
        // 枚举定义
        if (/^\s*(public|private|protected)?\s*enum\s+/.test(line)) {
          return VarStyle.Pascal;
        }
        // 方法定义 - 应该使用 camelCase
        if (/^\s*(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\([^)]*\)\s*[{;]/.test(line)) {
          return VarStyle.Camel;
        }
        // 成员变量定义 - 应该使用 camelCase
        if (/^\s*(public|private|protected)?\s*(static\s+)?(?!final\s+)\w+\s+\w+\s*[=;]/.test(line)) {
          return VarStyle.Camel;
        }
        // 注解
        if (/^\s*@\w+/.test(line)) {
          return VarStyle.Camel;
        }
        break;
        
      case "python":
        // 类定义
        if (/^\s*class\s+\w+/.test(line)) {
          return VarStyle.Pascal;
        }
        // 常量（全大写变量）
        if (/^\s*[A-Z][A-Z0-9_]*\s*=/.test(line)) {
          return VarStyle.Upper;
        }
        // 私有变量（以_开头）
        if (/^\s*_\w+\s*=/.test(line)) {
          return VarStyle.Snake;
        }
        // 魔术方法
        if (/^\s*def\s+__\w+__/.test(line)) {
          return VarStyle.Snake;
        }
        break;
        
      case "javascript":
      case "typescript":
        // 常量声明
        if (/^\s*const\s+[A-Z][A-Z0-9_]*\s*=/.test(line)) {
          return VarStyle.Upper;
        }
        // 类、接口、枚举、类型定义
        if (/^\s*(export\s+)?(abstract\s+)?(class|interface|enum|type)\s+/.test(line)) {
          return VarStyle.Pascal;
        }
        // React组件
        if (/^\s*(export\s+)?(default\s+)?function\s+[A-Z]\w*/.test(line) || 
            /^\s*(const|let|var)\s+[A-Z]\w*\s*=\s*\(/.test(line)) {
          return VarStyle.Pascal;
        }
        // 装饰器
        if (/^\s*@\w+/.test(line)) {
          return VarStyle.Camel;
        }
        break;
        
      case "c":
      case "cpp":
        // 宏定义
        if (/^\s*#define\s+[A-Z][A-Z0-9_]*/.test(line)) {
          return VarStyle.Upper;
        }
        // 结构体、枚举
        if (/^\s*(typedef\s+)?(struct|enum|union)\s+/.test(line)) {
          return VarStyle.Pascal;
        }
        break;
        
      case "csharp":
        // 类、接口、枚举
        if (/^\s*(public|private|protected|internal)?\s*(abstract\s+)?(class|interface|enum|struct)\s+/.test(line)) {
          return VarStyle.Pascal;
        }
        // 常量
        if (/^\s*(public|private|protected|internal)?\s*const\s+/.test(line)) {
          return VarStyle.Pascal;
        }
        // 属性
        if (/^\s*(public|private|protected|internal)?\s*\w+\s+\w+\s*{\s*(get|set)/.test(line)) {
          return VarStyle.Pascal;
        }
        break;
    }
    
    return null;
  }

  /**
   * 获取语言的默认命名风格
   */
  private getDefaultStyleByLanguage(language: string): VarStyle {
    switch (language) {
      case "python":
      case "ruby":
      case "rust":
        return VarStyle.Snake;
      case "c":
      case "cpp":
        return VarStyle.Snake;
      case "java":
      case "javascript":
      case "typescript":
      case "csharp":
      case "kotlin":
      case "swift":
        return VarStyle.Camel;
      default:
        return VarStyle.Camel;
    }
  }

  /**
   * 检查是否为类成员定义
   */
  private isClassMemberDefinition(line: string, language: string): boolean {
    switch (language) {
      case "java":
        // Java中类成员定义，但排除方法定义
        return /^\s*(public|private|protected)?\s*(static\s+)?(?!.*\([^)]*\))\w+\s+\w+\s*[=;]/.test(line);
      case "csharp":
        // C#中的属性定义通常以大写开头
        return /^\s*(public|private|protected)?\s*(static\s+)?\w+\s+[A-Z]\w*/.test(line);
      case "typescript":
        return /^\s*(public|private|protected)?\s*(static\s+)?\w+\s*:\s*/.test(line);
      default:
        return false;
    }
  }
}