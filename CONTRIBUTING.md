# 贡献指南

感谢您对 Smart Variables 项目的关注！我们欢迎各种形式的贡献，包括但不限于功能请求、bug 报告、代码贡献、文档改进等。

## 如何贡献

### 报告 Bug

1. 确保该 bug 尚未在 [GitHub Issues](https://github.com/samoy/smart-variables/issues) 中报告
2. 使用 Bug 报告模板创建新 issue，提供以下信息：
   - 清晰的 bug 描述
   - 重现步骤
   - 预期行为与实际行为
   - VS Code 版本和操作系统信息
   - 相关的日志或截图

### 提出新功能

1. 在 GitHub Issues 中创建新的功能请求
2. 描述该功能的使用场景和预期效果
3. 如果可能，提供功能的实现思路或伪代码

### 提交代码

1. Fork 项目仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m '添加某某功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个 Pull Request

## 开发设置

### 环境准备

1. 安装 [Node.js](https://nodejs.org/) (推荐 v16 或更高版本)
2. 安装 [pnpm](https://pnpm.io/installation)
3. 克隆仓库：`git clone https://github.com/samoy/smart-variables.git`
4. 安装依赖：`pnpm install`

### 项目结构

```
smart-variables/
├── src/                  # 源代码
│   ├── commands/         # 命令处理
│   ├── enums/            # 枚举定义
│   ├── services/         # 业务逻辑
│   ├── types/            # 类型定义
│   ├── ui/               # 用户界面
│   └── extension.ts      # 扩展入口
├── images/               # 图像资源
├── test/                 # 测试文件
└── package.json          # 项目配置
```

### 编译和测试

- 编译：`pnpm run compile`
- 监视模式：`pnpm run watch`
- 运行测试：`pnpm test`
- 启动调试：在 VS Code 中按 F5

## 代码规范

- 遵循 TypeScript 最佳实践
- 使用 ESLint 进行代码检查
- 保持代码简洁、模块化
- 为公共 API 添加 JSDoc 注释
- 编写单元测试覆盖新功能

## Pull Request 流程

1. 确保您的 PR 描述清晰地说明了更改内容和原因
2. 确保所有测试通过
3. 更新相关文档
4. 您的 PR 将由维护者审查，可能会要求进行更改
5. 一旦获得批准，您的 PR 将被合并

## 许可证

通过贡献代码，您同意您的贡献将在项目的 MIT 许可证下发布。

感谢您的贡献！