import { VarStyle } from "../enums/varStyle";

// 代码上下文分析结果
export interface CodeContext {
  currentLine: string;
  surroundingLines: string[];
  isInClass: boolean;
  isInFunction: boolean;
  isInInterface: boolean;
  isInEnum: boolean;
  classLevel: number;
  functionLevel: number;
  existingVariables: VariableInfo[];
  isConstantContext: boolean;
  isTypeDefinition: boolean;
}

// 变量信息
export interface VariableInfo {
  name: string;
  style: VarStyle;
}

// 变量匹配模式
export interface VariablePattern {
  regex: RegExp;
  nameGroup: number;
}