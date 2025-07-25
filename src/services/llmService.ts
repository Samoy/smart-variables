import OpenAI from "openai";
import { VarStyle } from "../enums/varStyle";
import { ConfigKey } from "../enums/configKey";
import { ConfigService } from "./configService";

/**
 * LLM 服务
 */
export class LLMService {
  private configService: ConfigService;

  constructor() {
    this.configService = new ConfigService();
  }

  /**
   * 调用 LLM API 获取变量名建议
   */
  public async generateVariableNames(meaning: string, style: VarStyle, count: number = 6, context?: { language?: string; currentLine?: string }): Promise<string[]> {
    const apiKey = this.configService.getConfigValue<string>(ConfigKey.API_KEY);
    if (!apiKey) {
      throw new Error(
        "API 密钥未设置，请在设置中配置 SmartVariables." + ConfigKey.API_KEY
      );
    }

    const baseUrl = this.configService.getConfigValue<string>(ConfigKey.BASE_URL);
    const openai = new OpenAI({ apiKey });
    if (baseUrl) {
      openai.baseURL = baseUrl;
    }

    const modelId = this.configService.getConfigValue<string>(ConfigKey.MODEL_ID);
    if (!modelId) {
      throw new Error(
        "模型未设置，请在设置中配置 SmartVariables." + ConfigKey.MODEL_ID
      );
    }

    const prompt = this.buildPrompt(meaning, style, count, context);

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

  /**
   * 构建提示词
   */
  private buildPrompt(meaning: string, style: VarStyle, count: number, context?: { language?: string; currentLine?: string }): string {
    // 检测用户输入的意图类型
    const intentType = this.detectIntentType(meaning);
    const examples = this.getExamplesByStyleAndIntent(style, intentType);
    
    // 构建上下文信息
    let contextInfo = '';
    if (context?.language) {
      contextInfo += `编程语言：${context.language}\n`;
    }
    if (context?.currentLine) {
      contextInfo += `当前代码行：${context.currentLine}\n`;
    }

    // 根据语言和意图类型提供更具体的指导
    const languageSpecificGuidance = this.getLanguageSpecificGuidance(context?.language, intentType);
    
    return `
请根据输入含义生成变量名：

输入含义：${meaning}
命名风格：${style}
意图类型：${intentType}
${contextInfo}

要求：
1. 生成 ${count} 个符合 ${style} 风格的${intentType}名称
2. 根据含义判断是动作还是属性：
   - 动作描述（如"获取名字"、"计算总数"、"检查状态"）→ 生成方法名（动词开头）
   - 属性描述（如"用户名字"、"商品价格"、"系统状态"）→ 生成属性名（名词性）
3. 语言特定要求：
${languageSpecificGuidance}
4. 一行一个，不要编号，不要解释，不要添加任何额外符号
5. 优先简短、无歧义，可使用常见缩写（如 info, config, temp 等）
6. 避免使用过于通用的词汇（如 data, item, value）

示例格式：
${examples}

请严格按照要求生成：
    `.trim();
  }

  /**
   * 获取语言特定的指导
   */
  private getLanguageSpecificGuidance(language?: string, intentType?: string): string {
    if (!language) {
      return '   - 使用英文命名，遵循通用编程规范';
    }

    const guidance: Record<string, Record<string, string>> = {
      'java': {
        '方法': '   - 方法名使用动词开头，如 getName(), calculateTotal(), checkStatus()\n   - 布尔方法使用 is/has/can 开头，如 isValid(), hasPermission()',
        '属性': '   - 成员变量使用名词，如 userName, totalAmount, currentStatus\n   - 布尔属性使用形容词，如 isActive, isEnabled'
      },
      'python': {
        '方法': '   - 函数名使用动词开头，如 get_name(), calculate_total(), check_status()\n   - 布尔函数使用 is/has/can 开头，如 is_valid(), has_permission()',
        '属性': '   - 变量使用名词，如 user_name, total_amount, current_status\n   - 布尔变量使用形容词，如 is_active, is_enabled'
      },
      'javascript': {
        '方法': '   - 函数名使用动词开头，如 getName(), calculateTotal(), checkStatus()\n   - 布尔函数使用 is/has/can 开头，如 isValid(), hasPermission()',
        '属性': '   - 变量使用名词，如 userName, totalAmount, currentStatus\n   - 布尔变量使用形容词，如 isActive, isEnabled'
      },
      'typescript': {
        '方法': '   - 方法名使用动词开头，如 getName(), calculateTotal(), checkStatus()\n   - 布尔方法使用 is/has/can 开头，如 isValid(), hasPermission()',
        '属性': '   - 属性使用名词，如 userName, totalAmount, currentStatus\n   - 布尔属性使用形容词，如 isActive, isEnabled'
      }
    };

    return guidance[language]?.[intentType || '属性'] || '   - 使用英文命名，遵循该语言的命名规范';
  }

  /**
   * 检测用户输入的意图类型
   */
  private detectIntentType(meaning: string): string {
    // 动作关键词
    const actionKeywords = [
      '获取', '取得', '得到', '拿到', '查找', '查询', '搜索', '寻找',
      '计算', '统计', '求和', '累加', '处理', '执行', '运行',
      '检查', '验证', '校验', '判断', '确认', '测试',
      '创建', '生成', '构建', '建立', '新建', '添加',
      '更新', '修改', '编辑', '改变', '设置', '配置',
      '删除', '移除', '清除', '销毁', '释放',
      '发送', '传输', '推送', '提交', '保存', '存储',
      '加载', '读取', '解析', '转换', '格式化',
      'get', 'fetch', 'find', 'search', 'query', 'retrieve',
      'calculate', 'compute', 'process', 'execute', 'run',
      'check', 'validate', 'verify', 'test', 'confirm',
      'create', 'generate', 'build', 'make', 'add',
      'update', 'modify', 'edit', 'change', 'set',
      'delete', 'remove', 'clear', 'destroy',
      'send', 'submit', 'save', 'store',
      'load', 'read', 'parse', 'convert', 'format'
    ];

    // 检查是否包含动作关键词
    const lowerMeaning = meaning.toLowerCase();
    const hasActionKeyword = actionKeywords.some(keyword => 
      lowerMeaning.includes(keyword.toLowerCase())
    );

    return hasActionKeyword ? '方法' : '属性';
  }

  /**
   * 根据风格和意图获取示例
   */
  private getExamplesByStyleAndIntent(style: VarStyle, intentType: string): string {
    const examples: Record<string, Record<string, string[]>> = {
      '方法': {
        [VarStyle.Camel]: ['getName', 'getUserInfo', 'calculateTotal', 'checkStatus'],
        [VarStyle.Pascal]: ['GetName', 'GetUserInfo', 'CalculateTotal', 'CheckStatus'],
        [VarStyle.Snake]: ['get_name', 'get_user_info', 'calculate_total', 'check_status'],
        [VarStyle.Upper]: ['GET_NAME', 'GET_USER_INFO', 'CALCULATE_TOTAL', 'CHECK_STATUS']
      },
      '属性': {
        [VarStyle.Camel]: ['userName', 'userInfo', 'totalAmount', 'currentStatus'],
        [VarStyle.Pascal]: ['UserName', 'UserInfo', 'TotalAmount', 'CurrentStatus'],
        [VarStyle.Snake]: ['user_name', 'user_info', 'total_amount', 'current_status'],
        [VarStyle.Upper]: ['USER_NAME', 'USER_INFO', 'TOTAL_AMOUNT', 'CURRENT_STATUS']
      }
    };

    const styleExamples = examples[intentType]?.[style] || [];
    return styleExamples.slice(0, 2).join(', ');
  }
}