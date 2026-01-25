## 扩展介绍

无名杀游戏的界面美化扩展

## 扩展结构

```
十周年UI/
├── extension.js              # 扩展入口
├── src/                      # 源代码
│   ├── core/                 # 核心模块
│   ├── animation/            # 动画模块
│   ├── audio/                # 音频模块
│   ├── effects/              # 特效模块
│   ├── features/             # 功能模块
│   ├── overrides/            # 覆盖模块
│   ├── skins/                # 皮肤模块
│   └── ui/                   # UI组件
├── ui/                       # UI插件
│   ├── lbtn/                 # 左侧按钮
│   ├── skill/                # 技能显示
│   └── character/            # 角色显示
├── assets/                   # 骨骼动画资源
├── audio/                    # 音频文件
└── image/                    # 图片资源
```

## 使用方法

### 安装

1. 下载扩展文件
2. 将整个文件夹放入无名杀的 `extension` 目录下
3. 打开本体设置-选项-通用-自动导入扩展
4. 重启游戏，在扩展列表中启用"十周年UI"

## 使用帮助

详细的配置说明请参考 `docs/` 目录：

- [卡牌皮肤注册](docs/card-skin-api.md) - 外部扩展注册卡牌皮肤的方法
- [前缀角标注册](docs/prefix-mark-api.md) - 武将前缀角标的配置方法
- [动态皮肤配置](docs/dynamic-skin-api.md) - Spine骨骼动画皮肤的配置方法
- [露头头像配置](docs/outcrop-avatar-api.md) - 露头头像的目录结构和API
- [骨骼动画定位](docs/spine-positioning-api.md) - Spine骨骼动画定位系统说明
- [单元测试指南](docs/unit-testing.md) - 单元测试的使用和开发指南
- [报错兜底处理](docs/secret.md) - 与无名杀版本不匹配下游玩方法

## 技术信息

**开发语言**：JavaScript (ES6+ Modules)

**模块化架构**：采用ES Module模块化开发，通过 `import/export` 组织代码结构。

## 贡献指南

欢迎提交 Issue 和 Pull Request。

### 贡献流程

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m "添加新功能"`
4. 推送分支：`git push origin feature/新功能`
5. 发起 Pull Request

### 开发建议

- 熟悉 HTML/CSS/JavaScript 和 ES6 Module 语法
- 了解无名杀扩展开发规范
- 测试时建议关闭其他美化扩展避免冲突

### 代码质量

提交代码前请确保：

```bash
# 运行测试
pnpm test

# 检查代码覆盖率
pnpm test:coverage
```

- 为新功能添加单元测试（如果需要
- 确保所有测试通过
- 保持代码覆盖率不降低

详见 [单元测试指南](docs/unit-testing.md)

## 相关链接

- 无名杀游戏：https://github.com/libnoname/noname

## 相关人员

- 原创作者：短歌
- 手杀UI原作者：橙续缘
- 上任维护者：萌新(转型中)
- 当前维护者：点点

## 许可证

GPL-3.0
