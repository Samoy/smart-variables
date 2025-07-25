import * as vscode from "vscode";
import { VarStyle } from "../enums/varStyle";
import { CodeContext, VariableInfo, VariablePattern } from "../types/context";

/**
 * 代码上下文分析器
 */
export class ContextAnalyzer {
  /**
   * 分析代码上下文
   */
  public analyzeContext(document: vscode.TextDocument, lineNumber: number, language: string): CodeContext {
    const contextLines = 10; // 分析前后10行
    const startLine = Math.max(0, lineNumber - contextLines);
    const endLine = Math.min(document.lineCount - 1, lineNumber + contextLines);
    
    const context: CodeContext = {
      currentLine: document.lineAt(lineNumber).text,
      surroundingLines: [],
      isInClass: false,
      isInFunction: false,
      isInInterface: false,
      isInEnum: false,
      classLevel: 0,
      functionLevel: 0,
      existingVariables: [],
      isConstantContext: false,
      isTypeDefinition: false
    };

    // 收集周围的代码行
    for (let i = startLine; i <= endLine; i++) {
      if (i !== lineNumber) {
        context.surroundingLines.push(document.lineAt(i).text);
      }
    }

    // 分析代码结构
    this.analyzeCodeStructure(context, language);
    
    // 提取现有变量的命名风格
    this.extractExistingVariableStyles(context, language);

    return context;
  }

  /**
   * 分析代码结构（类、函数、接口等）
   */
  private analyzeCodeStructure(context: CodeContext, language: string): void {
    const allLines = [context.currentLine, ...context.surroundingLines];
    
    for (const line of allLines) {
      const trimmedLine = line.trim();
      
      // 检测类定义
      if (this.isClassDefinition(trimmedLine, language)) {
        context.isInClass = true;
        context.classLevel++;
      }
      
      // 检测函数定义
      if (this.isFunctionDefinition(trimmedLine, language)) {
        context.isInFunction = true;
        context.functionLevel++;
      }
      
      // 检测接口定义
      if (this.isInterfaceDefinition(trimmedLine, language)) {
        context.isInInterface = true;
      }
      
      // 检测枚举定义
      if (this.isEnumDefinition(trimmedLine, language)) {
        context.isInEnum = true;
      }
      
      // 检测常量上下文
      if (this.isConstantContext(trimmedLine, language)) {
        context.isConstantContext = true;
      }
      
      // 检测类型定义上下文
      if (this.isTypeDefinition(trimmedLine, language)) {
        context.isTypeDefinition = true;
      }
    }
  }

  /**
   * 提取现有变量的命名风格
   */
  private extractExistingVariableStyles(context: CodeContext, language: string): void {
    const variablePatterns = this.getVariablePatterns(language);
    
    for (const line of context.surroundingLines) {
      for (const pattern of variablePatterns) {
        const matches = line.match(pattern.regex);
        if (matches && matches[pattern.nameGroup]) {
          const variableName = matches[pattern.nameGroup];
          const style = this.detectVariableStyle(variableName);
          context.existingVariables.push({ name: variableName, style });
        }
      }
    }
  }

  /**
   * 检测变量名的命名风格
   */
  private detectVariableStyle(variableName: string): VarStyle {
    if (/^[A-Z][A-Z0-9_]*$/.test(variableName)) {
      return VarStyle.Upper;
    }
    if (/^[A-Z][a-zA-Z0-9]*$/.test(variableName)) {
      return VarStyle.Pascal;
    }
    if (/^[a-z][a-z0-9]*(_[a-z0-9]+)*$/.test(variableName)) {
      return VarStyle.Snake;
    }
    return VarStyle.Camel;
  }

  /**
   * 获取变量匹配模式
   */
  private getVariablePatterns(language: string): VariablePattern[] {
    const patterns: VariablePattern[] = [];
    
    switch (language) {
      case "javascript":
      case "typescript":
        patterns.push(
          { regex: /(?:const|let|var)\s+(\w+)\s*=/, nameGroup: 1 },
          { regex: /function\s+(\w+)\s*\(/, nameGroup: 1 },
          { regex: /(\w+)\s*:\s*\w+/, nameGroup: 1 }, // 对象属性
          { regex: /class\s+(\w+)/, nameGroup: 1 }
        );
        break;
      case "python":
        patterns.push(
          { regex: /(\w+)\s*=/, nameGroup: 1 },
          { regex: /def\s+(\w+)\s*\(/, nameGroup: 1 },
          { regex: /class\s+(\w+)/, nameGroup: 1 }
        );
        break;
      case "java":
        patterns.push(
          { regex: /(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?\w+\s+(\w+)\s*[=;]/, nameGroup: 1 },
          { regex: /(?:public|private|protected)?\s*(?:static\s+)?\w+\s+(\w+)\s*\(/, nameGroup: 1 },
          { regex: /class\s+(\w+)/, nameGroup: 1 }
        );
        break;
    }
    
    return patterns;
  }

  // 辅助函数：检测各种代码结构
  private isClassDefinition(line: string, language: string): boolean {
    switch (language) {
      case "java":
      case "csharp":
        return /^\s*(public|private|protected)?\s*(abstract\s+)?class\s+/.test(line);
      case "python":
        return /^\s*class\s+\w+/.test(line);
      case "javascript":
      case "typescript":
        return /^\s*(export\s+)?(abstract\s+)?class\s+/.test(line);
      default:
        return false;
    }
  }

  private isFunctionDefinition(line: string, language: string): boolean {
    switch (language) {
      case "python":
        return /^\s*def\s+\w+\s*\(/.test(line);
      case "javascript":
      case "typescript":
        return /^\s*(export\s+)?(async\s+)?function\s+\w+\s*\(/.test(line) ||
               /^\s*(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/.test(line);
      case "java":
      case "csharp":
        return /^\s*(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\(/.test(line);
      default:
        return false;
    }
  }

  private isInterfaceDefinition(line: string, language: string): boolean {
    switch (language) {
      case "java":
      case "csharp":
      case "typescript":
        return /^\s*(export\s+)?interface\s+/.test(line);
      default:
        return false;
    }
  }

  private isEnumDefinition(line: string, language: string): boolean {
    switch (language) {
      case "java":
      case "csharp":
      case "typescript":
        return /^\s*(export\s+)?enum\s+/.test(line);
      default:
        return false;
    }
  }

  private isConstantContext(line: string, language: string): boolean {
    switch (language) {
      case "java":
        return /^\s*(public|private|protected)?\s*static\s+final\s+/.test(line);
      case "javascript":
      case "typescript":
        return /^\s*const\s+[A-Z][A-Z0-9_]*\s*=/.test(line);
      case "python":
        return /^\s*[A-Z][A-Z0-9_]*\s*=/.test(line);
      case "csharp":
        return /^\s*(public|private|protected)?\s*const\s+/.test(line);
      default:
        return false;
    }
  }

  private isTypeDefinition(line: string, language: string): boolean {
    switch (language) {
      case "typescript":
        return /^\s*(export\s+)?type\s+/.test(line);
      default:
        return false;
    }
  }
}