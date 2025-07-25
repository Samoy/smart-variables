import * as assert from 'assert';
import { LLMService } from '../services/llmService';
import { VarStyle } from '../enums/varStyle';

suite('LLMService Test Suite', () => {
  let llmService: LLMService;

  setup(() => {
    llmService = new LLMService();
  });

  suite('意图检测测试', () => {
    test('应该正确识别动作意图', () => {
      const actionInputs = [
        '获取名字',
        '计算总数',
        '检查状态',
        '创建用户',
        '删除文件',
        '发送消息',
        'get user info',
        'calculate total',
        'check status',
        'create user',
        'delete file',
        'send message'
      ];

      actionInputs.forEach(input => {
        const intentType = (llmService as any).detectIntentType(input);
        assert.strictEqual(intentType, '方法', `"${input}" 应该被识别为方法意图`);
      });
    });

    test('应该正确识别属性意图', () => {
      const propertyInputs = [
        '用户名字',
        '商品价格',
        '系统状态',
        '文件大小',
        '当前时间',
        '错误信息',
        'user name',
        'product price',
        'system status',
        'file size',
        'current time',
        'error message'
      ];

      propertyInputs.forEach(input => {
        const intentType = (llmService as any).detectIntentType(input);
        assert.strictEqual(intentType, '属性', `"${input}" 应该被识别为属性意图`);
      });
    });
  });

  suite('示例生成测试', () => {
    test('应该为方法意图生成正确的示例', () => {
      const examples = (llmService as any).getExamplesByStyleAndIntent(VarStyle.Camel, '方法');
      assert.ok(examples.includes('getName'), '应该包含方法示例');
      assert.ok(examples.includes('getUserInfo'), '应该包含方法示例');
    });

    test('应该为属性意图生成正确的示例', () => {
      const examples = (llmService as any).getExamplesByStyleAndIntent(VarStyle.Camel, '属性');
      assert.ok(examples.includes('userName'), '应该包含属性示例');
      assert.ok(examples.includes('userInfo'), '应该包含属性示例');
    });

    test('应该为不同风格生成对应示例', () => {
      // 测试 snake_case 方法示例
      const snakeMethodExamples = (llmService as any).getExamplesByStyleAndIntent(VarStyle.Snake, '方法');
      assert.ok(snakeMethodExamples.includes('get_name'), '应该包含 snake_case 方法示例');

      // 测试 PascalCase 属性示例
      const pascalPropertyExamples = (llmService as any).getExamplesByStyleAndIntent(VarStyle.Pascal, '属性');
      assert.ok(pascalPropertyExamples.includes('UserName'), '应该包含 PascalCase 属性示例');

      // 测试 UPPER_CASE 方法示例
      const upperMethodExamples = (llmService as any).getExamplesByStyleAndIntent(VarStyle.Upper, '方法');
      assert.ok(upperMethodExamples.includes('GET_NAME'), '应该包含 UPPER_CASE 方法示例');
    });
  });

  suite('提示词构建测试', () => {
    test('应该为动作描述构建方法提示词', () => {
      const prompt = (llmService as any).buildPrompt('获取用户名', VarStyle.Camel, 3, { language: 'java' });
      
      assert.ok(prompt.includes('获取用户名'), '应该包含原始输入');
      assert.ok(prompt.includes('方法'), '应该识别为方法意图');
      assert.ok(prompt.includes('camelCase'), '应该包含风格信息');
      assert.ok(prompt.includes('getName'), '应该包含方法示例');
    });

    test('应该为属性描述构建属性提示词', () => {
      const prompt = (llmService as any).buildPrompt('用户名称', VarStyle.Camel, 3, { language: 'java' });
      
      assert.ok(prompt.includes('用户名称'), '应该包含原始输入');
      assert.ok(prompt.includes('属性'), '应该识别为属性意图');
      assert.ok(prompt.includes('camelCase'), '应该包含风格信息');
      assert.ok(prompt.includes('userName'), '应该包含属性示例');
    });

    test('应该为不同风格构建对应提示词', () => {
      const snakePrompt = (llmService as any).buildPrompt('获取数据', VarStyle.Snake, 3, { language: 'python' });
      assert.ok(snakePrompt.includes('snake_case'), '应该包含 snake_case 风格');
      assert.ok(snakePrompt.includes('get_'), '应该包含 snake_case 示例');

      const pascalPrompt = (llmService as any).buildPrompt('用户信息', VarStyle.Pascal, 3, { language: 'csharp' });
      assert.ok(pascalPrompt.includes('PascalCase'), '应该包含 PascalCase 风格');
      assert.ok(pascalPrompt.includes('UserInfo'), '应该包含 PascalCase 示例');
    });

    test('应该包含语言特定指导', () => {
      const javaPrompt = (llmService as any).buildPrompt('获取数据', VarStyle.Camel, 3, { language: 'java' });
      assert.ok(javaPrompt.includes('编程语言：java'), '应该包含语言信息');
      assert.ok(javaPrompt.includes('方法名使用动词开头'), '应该包含Java特定指导');

      const pythonPrompt = (llmService as any).buildPrompt('用户名', VarStyle.Snake, 3, { language: 'python' });
      assert.ok(pythonPrompt.includes('编程语言：python'), '应该包含语言信息');
      assert.ok(pythonPrompt.includes('变量使用名词'), '应该包含Python特定指导');
    });
  });

  suite('边界情况测试', () => {
    test('应该处理空输入', () => {
      const intentType = (llmService as any).detectIntentType('');
      assert.strictEqual(intentType, '属性', '空输入应该默认为属性');
    });

    test('应该处理混合意图', () => {
      const intentType = (llmService as any).detectIntentType('获取用户名称');
      assert.strictEqual(intentType, '方法', '包含动作词的应该识别为方法');
    });

    test('应该处理英文和中文混合', () => {
      const intentType1 = (llmService as any).detectIntentType('get 用户信息');
      assert.strictEqual(intentType1, '方法', '英文动作词应该被识别');

      const intentType2 = (llmService as any).detectIntentType('获取 user info');
      assert.strictEqual(intentType2, '方法', '中文动作词应该被识别');
    });
  });
});