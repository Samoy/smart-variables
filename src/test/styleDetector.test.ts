import * as assert from 'assert';
import * as vscode from 'vscode';
import { StyleDetector } from '../services/styleDetector';
import { VarStyle } from '../enums/varStyle';

suite('StyleDetector Test Suite', () => {
  let styleDetector: StyleDetector;

  setup(() => {
    styleDetector = new StyleDetector();
  });

  suite('Java 语言测试', () => {
    test('静态常量应该使用 UPPER_CASE', () => {
      const line = 'public static final String API_KEY = "test";';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Upper);
    });

    test('类定义应该使用 PascalCase', () => {
      const line = 'public class UserService {';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Pascal);
    });

    test('接口定义应该使用 PascalCase', () => {
      const line = 'public interface UserRepository {';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Pascal);
    });

    test('枚举定义应该使用 PascalCase', () => {
      const line = 'public enum UserStatus {';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Pascal);
    });

    test('普通成员变量应该使用 camelCase', () => {
      const line = 'private String userName;';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Camel);
    });

    test('方法声明应该使用 camelCase', () => {
      const line = 'public void getUserName() {';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Camel);
    });

    test('局部变量声明应该使用 camelCase', () => {
      const line = 'String userEmail = "test@example.com";';
      const result = styleDetector.getVarStyleByLine('java', line);
      assert.strictEqual(result, VarStyle.Camel);
    });
  });

  suite('Python 语言测试', () => {
    test('类定义应该使用 PascalCase', () => {
      const line = 'class UserService:';
      const result = styleDetector.getVarStyleByLine('python', line);
      assert.strictEqual(result, VarStyle.Pascal);
    });

    test('常量应该使用 UPPER_CASE', () => {
      const line = 'API_KEY = "test"';
      const result = styleDetector.getVarStyleByLine('python', line);
      assert.strictEqual(result, VarStyle.Upper);
    });

    test('普通变量应该使用 snake_case', () => {
      const line = 'user_name = "test"';
      const result = styleDetector.getVarStyleByLine('python', line);
      assert.strictEqual(result, VarStyle.Snake);
    });

    test('私有变量应该使用 snake_case', () => {
      const line = '_private_var = "test"';
      const result = styleDetector.getVarStyleByLine('python', line);
      assert.strictEqual(result, VarStyle.Snake);
    });

    test('魔术方法应该使用 snake_case', () => {
      const line = 'def __init__(self):';
      const result = styleDetector.getVarStyleByLine('python', line);
      assert.strictEqual(result, VarStyle.Snake);
    });
  });

  suite('JavaScript/TypeScript 语言测试', () => {
    test('常量声明应该使用 UPPER_CASE', () => {
      const line = 'const API_KEY = "test";';
      const result = styleDetector.getVarStyleByLine('javascript', line);
      assert.strictEqual(result, VarStyle.Upper);
    });

    test('类定义应该使用 PascalCase', () => {
      const line = 'class UserService {';
      const result = styleDetector.getVarStyleByLine('javascript', line);
      assert.strictEqual(result, VarStyle.Pascal);
    });

    test('接口定义应该使用 PascalCase', () => {
      const line = 'interface UserRepository {';
      const result = styleDetector.getVarStyleByLine('typescript', line);
      assert.strictEqual(result, VarStyle.Pascal);
    });

    test('React组件应该使用 PascalCase', () => {
      const line = 'function UserComponent() {';
      const result = styleDetector.getVarStyleByLine('javascript', line);
      assert.strictEqual(result, VarStyle.Pascal);
    });

    test('普通变量应该使用 camelCase', () => {
      const line = 'const userName = "test";';
      const result = styleDetector.getVarStyleByLine('javascript', line);
      assert.strictEqual(result, VarStyle.Camel);
    });
  });

  suite('默认语言测试', () => {
    test('未知语言应该使用默认的 camelCase', () => {
      const line = 'var test = "value";';
      const result = styleDetector.getVarStyleByLine('unknown', line);
      assert.strictEqual(result, VarStyle.Camel);
    });
  });
});