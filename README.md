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

## 外部扩展API

十周年UI提供以下API供外部扩展调用：

### 1. 卡牌皮肤注册

```javascript
// 全局函数，可在十周年UI加载前后调用
registerDecadeCardSkin({
	extensionName: "我的扩展", // 必填，扩展名称
	skinKey: "decade", // 皮肤类型：decade/caise/online/gold/bingkele
	cardNames: ["mycard1", "mycard2"], // 推荐：指定卡牌列表
	extension: "png", // 图片格式，默认png
});

// 图片路径：extension/我的扩展/image/card-skins/decade/mycard1.png
```

### 2. 十周年样式前缀角标注册

```javascript
// 通过 decadeModule.prefixMark 访问
decadeModule.prefixMark.registerPrefix("自定义", "custom");
// 批量注册
decadeModule.prefixMark.registerPrefixes({ 前缀A: "styleA", 前缀B: "styleB" });
// 检查前缀
decadeModule.prefixMark.hasPrefix("自定义"); // true
```

需配合CSS样式：`.custom-mark { background-image: url(...); }`

## 技术信息

**开发语言**：JavaScript (ES6+ Modules)

**模块化架构**：采用ES Module模块化开发，通过 `import/export` 组织代码结构。

## 贡献指南

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/新功能`
3. 提交更改：`git commit -m "添加新功能"`
4. 推送分支：`git push origin feature/新功能`
5. 发起 Pull Request

开发建议：

- 熟悉 HTML/CSS/JavaScript 和 ES6 Module 语法
- 了解无名杀扩展开发规范
- 测试时建议关闭其他美化扩展避免冲突

## 相关链接

- 无名杀游戏：https://github.com/libnoname/noname

## 相关人员

- 原创作者：短歌
- 手杀UI原作者：橙续缘
- 上任维护者：萌新(转型中)
- 当前维护者：点点

## 许可证

GPL-3.0
