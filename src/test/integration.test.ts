import * as assert from 'assert';
import { StyleDetector } from '../services/styleDetector';
import { ConfigService } from '../services/configService';
import { VarStyle } from '../enums/varStyle';
import { ConfigKey } from '../enums/configKey';

suite('集成测试', () => {
  let styleDetector: StyleDetector;
  let configService: ConfigService;

  setup(() => {
    styleDetector = new StyleDetector();
    configService = new ConfigService();
  });

  suite('真实场景测试', () => {
    test('Java 类中的不同场景', () => {
      // 测试 Java 类中的各种情况
      const testCases = [
        {
          line: 'public class UserService {',
          expected: VarStyle.Pascal,
          description: '类定义'
        },
        {
          line: 'private String userName;',
          expected: VarStyle.Camel,
          description: '成员变量'
        },
        {
          line: 'public static final String API_KEY = "test";',
          expected: VarStyle.Upper,
          description: '静态常量'
        },
        {
          line: 'public void getUserName() {',
          expected: VarStyle.Camel,
          description: '方法定义'
        },
        {
          line: 'public interface UserRepository {',
          expected: VarStyle.Pascal,
          description: '接口定义'
        }
      ];

      testCases.forEach(testCase => {
        const result = styleDetector.getVarStyleByLine('java', testCase.line);
        assert.strictEqual(
          result, 
          testCase.expected, 
          `${testCase.description}: "${testCase.line}" 应该返回 ${testCase.expected}`
        );
      });
    });

    test('Python 模块中的不同场景', () => {
      const testCases = [
        {
          line: 'class UserService:',
          expected: VarStyle.Pascal,
          description: '类定义'
        },
        {
          line: 'user_name = "test"',
          expected: VarStyle.Snake,
          description: '普通变量'
        },
        {
          line: 'API_KEY = "test"',
          expected: VarStyle.Upper,
          description: '常量'
        },
        {
          line: 'def get_user_name(self):',
          expected: VarStyle.Snake,
          description: '方法定义'
        },
        {
          line: '_private_var = "test"',
          expected: VarStyle.Snake,
          description: '私有变量'
        }
      ];

      testCases.forEach(testCase => {
        const result = styleDetector.getVarStyleByLine('python', testCase.line);
        assert.strictEqual(
          result, 
          testCase.expected, 
          `${testCase.description}: "${testCase.line}" 应该返回 ${testCase.expected}`
        );
      });
    });

    test('JavaScript/TypeScript 中的不同场景', () => {
      const testCases = [
        {
          line: 'class UserService {',
          expected: VarStyle.Pascal,
          description: '类定义'
        },
        {
          line: 'const userName = "test";',
          expected: VarStyle.Camel,
          description: '普通常量'
        },
        {
          line: 'const API_KEY = "test";',
          expected: VarStyle.Upper,
          description: '全大写常量'
        },
        {
          line: 'interface UserRepository {',
          expected: VarStyle.Pascal,
          description: '接口定义'
        },
        {
          line: 'function UserComponent() {',
          expected: VarStyle.Pascal,
          description: 'React组件'
        }
      ];

      testCases.forEach(testCase => {
        const result = styleDetector.getVarStyleByLine('javascript', testCase.line);
        assert.strictEqual(
          result, 
          testCase.expected, 
          `${testCase.description}: "${testCase.line}" 应该返回 ${testCase.expected}`
        );
      });
    });
  });

  suite('配置服务测试', () => {
    test('应该能够读取配置值', () => {
      // 注意：在测试环境中，配置值可能为 undefined
      const apiKey = configService.getConfigValue<string>(ConfigKey.API_KEY);
      // 在测试环境中，配置通常是未设置的
      assert.ok(apiKey === undefined || typeof apiKey === 'string');
    });

    test('应该能够获取配置段名称', () => {
      const section = configService.getConfigSection();
      assert.strictEqual(section, 'SmartVariables');
    });
  });

  suite('边界情况测试', () => {
    test('空行应该返回默认风格', () => {
      const result = styleDetector.getVarStyleByLine('java', '');
      assert.strictEqual(result, VarStyle.Camel);
    });

    test('注释行应该返回默认风格', () => {
      const result = styleDetector.getVarStyleByLine('java', '// 这是一个注释');
      assert.strictEqual(result, VarStyle.Camel);
    });

    test('未知语言应该返回默认风格', () => {
      const result = styleDetector.getVarStyleByLine('unknown-language', 'var test = "value";');
      assert.strictEqual(result, VarStyle.Camel);
    });

    test('复杂的 Java 泛型声明', () => {
      const line = 'private List<Map<String, Object>> complexData;';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Camel);
    });

    test('Python 装饰器', () => {
      const line = '@property';
      const result = styleDetector.getVarStyleByLine('python', line);
      assert.strictEqual(result, VarStyle.Snake);
    });
  });
});