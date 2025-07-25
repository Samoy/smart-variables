# Smart Variables

> ✨✨享受更智能的编码体验！✨✨

Smart Variables 是一个强大的 VS Code 扩展，它利用 AI 技术帮助开发者生成符合编程规范的变量名、方法名和属性名。无论您使用哪种编程语言，Smart Variables 都能根据上下文智能推荐最合适的命名风格。

## 功能特点

### 智能变量命名

只需输入变量的含义（支持中文或英文），Smart Variables 就能生成多个符合当前编程语言规范的变量名建议：

- **自动识别代码上下文**：根据当前文件类型和代码结构推荐合适的命名风格
- **多语言支持**：适配 Java、Python、JavaScript/TypeScript、C# 等主流编程语言的命名规范
- **智能意图识别**：自动区分方法名和属性名，生成更准确的建议
  - 输入"获取用户信息" → 生成方法名如 `getUserInfo`
  - 输入"用户信息" → 生成属性名如 `userInfo`

### 多种命名风格

支持所有主流的命名风格：

- **小驼峰命名法 (camelCase)**：如 `userName`、`getDataById`
- **大驼峰命名法 (PascalCase)**：如 `UserName`、`DataService`
- **蛇形命名法 (snake_case)**：如 `user_name`、`get_data_by_id`
- **全大写蛇形命名法 (UPPER_CASE)**：如 `API_KEY`、`MAX_COUNT`

## 快速入门

### 1. 安装与配置

1. 安装扩展后，点击 VS Code 左侧活动栏的"扩展"图标
2. 找到 Smart Variables 扩展，点击"设置"图标
3. 配置以下必要项：
   - `SmartVariables.apiKey`: 输入您的 OpenAI API 密钥
   - `SmartVariables.modelId`: 输入模型 ID，如 `gpt-3.5-turbo`

### 2. 基本使用

1. 在编辑器中，将光标放在您想要插入变量名的位置
2. 按下快捷键 `Ctrl+Alt+N`（Mac: `Cmd+Alt+N`）
3. 在弹出的输入框中输入变量含义，例如：
   - 方法名示例：`获取用户信息`、`计算总价`
   - 属性名示例：`用户姓名`、`商品价格`
4. 从弹出的建议列表中选择合适的变量名

### 3. 切换模式

点击状态栏上的 Smart Variables 图标可以在以下两种模式间切换：

- **自动模式**：根据当前编程语言和代码上下文自动推断命名风格
- **手动模式**：每次都询问使用哪种命名风格

## 高级技巧

### 1. 语言特定命名

Smart Variables 会根据不同编程语言自动调整命名风格：

- **Java**:
  - 类名：`UserService`（PascalCase）
  - 方法名：`getUserInfo()`（camelCase）
  - 常量：`MAX_RETRY_COUNT`（UPPER_CASE）

- **Python**:
  - 类名：`UserService`（PascalCase）
  - 函数名：`get_user_info()`（snake_case）
  - 常量：`MAX_RETRY_COUNT`（UPPER_CASE）

- **JavaScript/TypeScript**:
  - 类名：`UserService`（PascalCase）
  - 方法名：`getUserInfo()`（camelCase）
  - 常量：`MAX_RETRY_COUNT`（UPPER_CASE）

### 2. 意图识别

Smart Variables 能智能识别您的意图：

- 输入动作描述（如"获取用户信息"）→ 生成方法名
- 输入属性描述（如"用户信息"）→ 生成属性名

### 3. 上下文感知

在不同的代码上下文中，Smart Variables 会提供不同的建议：

- 在类定义内 → 推荐符合类成员命名规范的名称
- 在函数内 → 推荐符合局部变量命名规范的名称
- 在常量区域 → 推荐全大写的命名风格

## 常见问题解答

### Q: 为什么我看不到任何建议？
A: 请确保您已正确配置 API 密钥，并且网络连接正常。

### Q: 支持哪些编程语言？
A: 主要支持 Java、Python、JavaScript/TypeScript、C#，但也兼容其他大多数编程语言。

### Q: 生成的变量名不符合我的期望怎么办？
A: 尝试提供更具体的变量含义描述，或切换到手动模式选择命名风格。

## 快捷键参考

| 功能 | Windows/Linux | macOS |
|------|--------------|-------|
| 生成变量名 | `Ctrl+Alt+N` | `Cmd+Alt+N` |
| 切换模式 | 点击状态栏图标 | 点击状态栏图标 |


## 更新日志

详细的更新历史请查看 [CHANGELOG.md](CHANGELOG.md)。

## 已知问题

- 在某些复杂的代码结构中，自动风格检测可能不够准确
- 需要网络连接以访问 AI 服务

## 反馈与支持

如有问题或建议，请访问我们的 [GitHub 仓库](https://github.com/samoy/smart-variables) 提交 issue。

## 贡献

欢迎提交问题报告和功能请求到我们的 [GitHub 仓库](https://github.com/samoy/smart-variables)。

## 许可证

此扩展遵循 MIT 许可证。

---
