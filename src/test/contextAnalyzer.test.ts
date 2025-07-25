import * as assert from 'assert';
import { ContextAnalyzer } from '../services/contextAnalyzer';
import { VarStyle } from '../enums/varStyle';

suite('ContextAnalyzer Test Suite', () => {
  let contextAnalyzer: ContextAnalyzer;

  setup(() => {
    contextAnalyzer = new ContextAnalyzer();
  });

  suite('变量风格检测测试', () => {
    test('应该正确检测 camelCase 变量', () => {
      const testCases = [
        'userName',
        'firstName',
        'isActive',
        'getUserName',
        'myVariableName'
      ];

      testCases.forEach(variableName => {
        const result = (contextAnalyzer as any).detectVariableStyle(variableName);
        assert.strictEqual(result, VarStyle.Camel, `${variableName} 应该被识别为 camelCase`);
      });
    });

    test('应该正确检测 PascalCase 变量', () => {
      const testCases = [
        'UserName',
        'FirstName',
        'IsActive',
        'GetUserName',
        'MyClassName'
      ];

      testCases.forEach(variableName => {
        const result = (contextAnalyzer as any).detectVariableStyle(variableName);
        assert.strictEqual(result, VarStyle.Pascal, `${variableName} 应该被识别为 PascalCase`);
      });
    });

    test('应该正确检测 snake_case 变量', () => {
      const testCases = [
        'user_name',
        'first_name',
        'is_active',
        'get_user_name',
        'my_variable_name'
      ];

      testCases.forEach(variableName => {
        const result = (contextAnalyzer as any).detectVariableStyle(variableName);
        assert.strictEqual(result, VarStyle.Snake, `${variableName} 应该被识别为 snake_case`);
      });
    });

    test('应该正确检测 UPPER_CASE 变量', () => {
      const testCases = [
        'USER_NAME',
        'FIRST_NAME',
        'IS_ACTIVE',
        'API_KEY',
        'MAX_COUNT'
      ];

      testCases.forEach(variableName => {
        const result = (contextAnalyzer as any).detectVariableStyle(variableName);
        assert.strictEqual(result, VarStyle.Upper, `${variableName} 应该被识别为 UPPER_CASE`);
      });
    });
  });

  suite('代码结构检测测试', () => {
    test('应该正确检测 Java 类定义', () => {
      const testCases = [
        'public class UserService {',
        'private class InnerClass {',
        'protected abstract class BaseService {',
        'class SimpleClass {'
      ];

      testCases.forEach(line => {
        const result = (contextAnalyzer as any).isClassDefinition(line, 'java');
        assert.strictEqual(result, true, `${line} 应该被识别为类定义`);
      });
    });

    test('应该正确检测 Python 类定义', () => {
      const testCases = [
        'class UserService:',
        'class UserService(BaseService):',
        'class UserService(BaseService, Mixin):'
      ];

      testCases.forEach(line => {
        const result = (contextAnalyzer as any).isClassDefinition(line, 'python');
        assert.strictEqual(result, true, `${line} 应该被识别为类定义`);
      });
    });

    test('应该正确检测 Java 函数定义', () => {
      const testCases = [
        'public void getUserName() {',
        'private String getName(int id) {',
        'protected static boolean isValid() {',
        'public User findUser(String name) {'
      ];

      testCases.forEach(line => {
        const result = (contextAnalyzer as any).isFunctionDefinition(line, 'java');
        assert.strictEqual(result, true, `${line} 应该被识别为函数定义`);
      });
    });

    test('应该正确检测 Python 函数定义', () => {
      const testCases = [
        'def get_user_name():',
        'def get_name(user_id):',
        'def is_valid(self):',
        'def find_user(self, name):'
      ];

      testCases.forEach(line => {
        const result = (contextAnalyzer as any).isFunctionDefinition(line, 'python');
        assert.strictEqual(result, true, `${line} 应该被识别为函数定义`);
      });
    });
  });

  suite('变量模式匹配测试', () => {
    test('应该正确匹配 JavaScript 变量模式', () => {
      const patterns = (contextAnalyzer as any).getVariablePatterns('javascript');
      assert.ok(patterns.length > 0, '应该返回 JavaScript 变量模式');

      // 测试 const 声明
      const constPattern = patterns.find((p: any) => p.regex.test('const userName = "test";'));
      assert.ok(constPattern, '应该匹配 const 声明');

      // 测试函数声明
      const funcPattern = patterns.find((p: any) => p.regex.test('function getUserName() {'));
      assert.ok(funcPattern, '应该匹配函数声明');
    });

    test('应该正确匹配 Python 变量模式', () => {
      const patterns = (contextAnalyzer as any).getVariablePatterns('python');
      assert.ok(patterns.length > 0, '应该返回 Python 变量模式');

      // 测试变量赋值
      const varPattern = patterns.find((p: any) => p.regex.test('user_name = "test"'));
      assert.ok(varPattern, '应该匹配变量赋值');

      // 测试函数定义
      const funcPattern = patterns.find((p: any) => p.regex.test('def get_user_name():'));
      assert.ok(funcPattern, '应该匹配函数定义');
    });

    test('应该正确匹配 Java 变量模式', () => {
      const patterns = (contextAnalyzer as any).getVariablePatterns('java');
      assert.ok(patterns.length > 0, '应该返回 Java 变量模式');

      // 测试变量声明
      const varPattern = patterns.find((p: any) => p.regex.test('private String userName;'));
      assert.ok(varPattern, '应该匹配变量声明');
    });
  });
});