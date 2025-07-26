import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CommandManager } from '../commands/commandManager';
import { StatusBarManager } from '../ui/statusBarManager';
import { ConfigService } from '../services/configService';
import { StyleDetector } from '../services/styleDetector';
import { LLMService } from '../services/llmService';
import { VarStyle } from '../enums/varStyle';
import { ConfigKey } from '../enums/configKey';

suite('CommandManager 测试', () => {
  let commandManager: CommandManager;
  let statusBarManagerStub: sinon.SinonStubbedInstance<StatusBarManager>;
  let configServiceStub: sinon.SinonStubbedInstance<ConfigService>;
  let styleDetectorStub: sinon.SinonStubbedInstance<StyleDetector>;
  let llmServiceStub: sinon.SinonStubbedInstance<LLMService>;
  
  // vscode API 相关的存根
  let showInputBoxStub: sinon.SinonStub;
  let showQuickPickStub: sinon.SinonStub;
  let showErrorMessageStub: sinon.SinonStub;
  let showWarningMessageStub: sinon.SinonStub;
  let registerCommandStub: sinon.SinonStub;
  
  // 模拟的编辑器和文档
  let mockEditor: any;
  let mockDocument: any;
  let mockSelection: any;
  let editorEditStub: any;
  
  setup(() => {
    // 创建存根
    statusBarManagerStub = sinon.createStubInstance(StatusBarManager);
    configServiceStub = sinon.createStubInstance(ConfigService);
    styleDetectorStub = sinon.createStubInstance(StyleDetector);
    llmServiceStub = sinon.createStubInstance(LLMService);
    
    // 模拟 vscode API
    showInputBoxStub = sinon.stub(vscode.window, 'showInputBox');
    showQuickPickStub = sinon.stub(vscode.window, 'showQuickPick');
    showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage');
    showWarningMessageStub = sinon.stub(vscode.window, 'showWarningMessage');
    registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');
    
    // 模拟编辑器和文档
    mockSelection = {
      active: { line: 10, character: 5 }
    };
    
    mockDocument = {
      languageId: 'javascript',
      lineAt: sinon.stub().returns({ text: 'const userName = "test";' }),
      getText: sinon.stub().returns('const userName = "test";')
    };
    
    editorEditStub = sinon.stub().callsFake((callback) => {
      callback({ insert: sinon.stub() });
      return Promise.resolve(true);
    });
    
    mockEditor = {
      document: mockDocument,
      selection: mockSelection,
      edit: editorEditStub
    };
    
    sinon.stub(vscode.window, 'activeTextEditor').get(() => mockEditor);
    
    // 设置存根的返回值
    configServiceStub.getConfigValue.withArgs(ConfigKey.PREFERRED_STYLE).returns('auto');
    styleDetectorStub.getVarStyleByLine.returns(VarStyle.Camel);
    llmServiceStub.generateVariableNames.resolves(['userName', 'name', 'user']);
    
    // 创建 CommandManager 实例，注入模拟的依赖
    commandManager = new CommandManager(statusBarManagerStub);
    
    // 替换 CommandManager 内部的依赖
    commandManager.configService = configServiceStub;
    commandManager.styleDetector = styleDetectorStub;
    commandManager.llmService = llmServiceStub;
  });
  
  teardown(() => {
    // 恢复所有存根
    sinon.restore();
  });
  
  suite('registerQuickToggleCommand', () => {
    test('应该注册切换命令并在点击时切换模式', async () => {
      // 存储命令处理函数
      let commandHandler: Function | undefined;
      
      // 模拟命令注册
      registerCommandStub.callsFake((commandId: string, handler: Function) => {
        commandHandler = handler;
        return { dispose: () => {} };
      });
      
      // 执行
      const disposable = commandManager.registerQuickToggleCommand();
      
      // 断言命令注册
      assert.ok(registerCommandStub.calledOnce);
      assert.strictEqual(registerCommandStub.firstCall.args[0], 'SmartVariables.toggle');
      
      // 确保命令处理函数已被设置
      assert.ok(commandHandler);
      
      // 模拟命令执行
      await commandHandler();
      
      // 断言配置更新和状态栏更新
      assert.ok(configServiceStub.updateConfigValue.calledOnce);
      assert.deepStrictEqual(
        configServiceStub.updateConfigValue.firstCall.args,
        [ConfigKey.PREFERRED_STYLE, 'ask', vscode.ConfigurationTarget.Global]
      );
      assert.ok(statusBarManagerStub.updateTooltip.calledOnce);
      assert.strictEqual(statusBarManagerStub.updateTooltip.firstCall.args[0], 'ask');
    });
  });
  
  suite('registerSuggestCommand', () => {
    test('应该注册建议命令并在自动模式下生成变量名', async () => {
      // 安排
      showInputBoxStub.resolves('用户名');
      showQuickPickStub.resolves('userName');
      
      // 存储命令处理函数
      let commandHandler: Function | undefined;
      
      // 模拟命令注册
      registerCommandStub.callsFake((commandId: string, handler: Function) => {
        commandHandler = handler;
        return { dispose: () => {} };
      });
      
      // 执行
      const disposable = commandManager.registerSuggestCommand();
      
      // 断言命令注册
      assert.ok(registerCommandStub.calledOnce);
      assert.strictEqual(registerCommandStub.firstCall.args[0], 'SmartVariables.suggest');
      
      // 确保命令处理函数已被设置
      assert.ok(commandHandler);
      
      // 模拟命令执行
      await commandHandler();
      
      // 断言用户交互和服务调用
      assert.ok(showInputBoxStub.calledOnce);
      assert.ok(statusBarManagerStub.setLoading.calledTwice);
      assert.ok(statusBarManagerStub.setLoading.firstCall.args[0]);  // 开始加载
      assert.ok(!statusBarManagerStub.setLoading.secondCall.args[0]); // 结束加载
      assert.ok(llmServiceStub.generateVariableNames.calledOnce);
      assert.ok(showQuickPickStub.calledOnce);
      assert.ok(editorEditStub.calledOnce);
    });
    
    test('当用户取消输入时应该中止操作', async () => {
      // 安排
      showInputBoxStub.resolves(undefined);  // 用户取消
      
      // 存储命令处理函数
      let commandHandler: Function | undefined;
      
      // 模拟命令注册
      registerCommandStub.callsFake((commandId: string, handler: Function) => {
        commandHandler = handler;
        return { dispose: () => {} };
      });
      
      // 执行
      const disposable = commandManager.registerSuggestCommand();
      
      // 确保命令处理函数已被设置
      assert.ok(commandHandler);
      
      // 模拟命令执行
      await commandHandler();
      
      // 断言
      assert.ok(!llmServiceStub.generateVariableNames.called);
      assert.ok(!showQuickPickStub.called);
      assert.ok(!editorEditStub.called);
    });
    
    test('当用户输入空字符串时应该中止操作', async () => {
      // 安排
      showInputBoxStub.resolves('  ');  // 空白字符串
      
      // 存储命令处理函数
      let commandHandler: Function | undefined;
      
      // 模拟命令注册
      registerCommandStub.callsFake((commandId: string, handler: Function) => {
        commandHandler = handler;
        return { dispose: () => {} };
      });
      
      // 执行
      const disposable = commandManager.registerSuggestCommand();
      
      // 确保命令处理函数已被设置
      assert.ok(commandHandler);
      
      // 模拟命令执行
      await commandHandler();
      
      // 断言
      assert.ok(!llmServiceStub.generateVariableNames.called);
      assert.ok(!showQuickPickStub.called);
      assert.ok(!editorEditStub.called);
    });
    
    test('当生成变量名失败时应该显示错误消息', async () => {
      // 安排
      showInputBoxStub.resolves('用户名');
      llmServiceStub.generateVariableNames.rejects(new Error('API错误'));
      
      // 存储命令处理函数
      let commandHandler: Function | undefined;
      
      // 模拟命令注册
      registerCommandStub.callsFake((commandId: string, handler: Function) => {
        commandHandler = handler;
        return { dispose: () => {} };
      });
      
      // 执行
      const disposable = commandManager.registerSuggestCommand();
      
      // 确保命令处理函数已被设置
      assert.ok(commandHandler);
      
      // 模拟命令执行
      await commandHandler();
      
      // 断言
      assert.ok(showErrorMessageStub.calledOnce);
      assert.ok(showErrorMessageStub.firstCall.args[0].includes('生成变量名失败'));
      assert.ok(statusBarManagerStub.setLoading.calledTwice);
      assert.ok(!statusBarManagerStub.setLoading.secondCall.args[0]); // 结束加载
    });
    
    test('当生成的变量名列表为空时应该显示错误消息', async () => {
      // 安排
      showInputBoxStub.resolves('用户名');
      llmServiceStub.generateVariableNames.resolves([]);
      
      // 存储命令处理函数
      let commandHandler: Function | undefined;
      
      // 模拟命令注册
      registerCommandStub.callsFake((commandId: string, handler: Function) => {
        commandHandler = handler;
        return { dispose: () => {} };
      });
      
      // 执行
      const disposable = commandManager.registerSuggestCommand();
      
      // 确保命令处理函数已被设置
      assert.ok(commandHandler);
      
      // 模拟命令执行
      await commandHandler();
      
      // 断言
      assert.ok(showErrorMessageStub.calledOnce);
      assert.strictEqual(showErrorMessageStub.firstCall.args[0], '未生成任何变量名');
    });
    
    test('当用户取消选择变量名时应该中止操作', async () => {
      // 安排
      showInputBoxStub.resolves('用户名');
      showQuickPickStub.resolves(undefined);  // 用户取消选择
      
      // 存储命令处理函数
      let commandHandler: Function | undefined;
      
      // 模拟命令注册
      registerCommandStub.callsFake((commandId: string, handler: Function) => {
        commandHandler = handler;
        return { dispose: () => {} };
      });
      
      // 执行
      const disposable = commandManager.registerSuggestCommand();
      
      // 确保命令处理函数已被设置
      assert.ok(commandHandler);
      
      // 模拟命令执行
      await commandHandler();
      
      // 断言
      assert.ok(!editorEditStub.called);  // 编辑函数不应被调用
    });
  });
  
  suite('detectStyle', () => {
    test('在自动模式下应该使用StyleDetector', async () => {
      // 安排
      configServiceStub.getConfigValue.withArgs(ConfigKey.PREFERRED_STYLE).returns('auto');
      
      // 执行
      const style = await commandManager.detectStyle();
      
      // 断言
      assert.strictEqual(style, VarStyle.Camel);
      assert.ok(styleDetectorStub.getVarStyleByLine.calledOnce);
    });
    
    test('在手动模式下应该显示选择框', async () => {
      // 安排
      configServiceStub.getConfigValue.withArgs(ConfigKey.PREFERRED_STYLE).returns('ask');
      showQuickPickStub.resolves({ label: VarStyle.Pascal });
      
      // 执行
      const style = await commandManager.detectStyle();
      
      // 断言
      assert.strictEqual(style, VarStyle.Pascal);
      assert.ok(showQuickPickStub.calledOnce);
    });
    
    test('在手动模式下用户取消选择时应该返回默认风格', async () => {
      // 安排
      configServiceStub.getConfigValue.withArgs(ConfigKey.PREFERRED_STYLE).returns('ask');
      showQuickPickStub.resolves(undefined);  // 用户取消
      
      // 执行
      const style = await commandManager.detectStyle();
      
      // 断言
      assert.strictEqual(style, VarStyle.Camel);
      assert.ok(showWarningMessageStub.calledOnce);
    });
  });
});