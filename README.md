## 扩展介绍

十周年UI是一个界面美化扩展，基于原手杀UI（界面美化）扩展开发，提供多种界面风格切换、卡牌美化、动态皮肤、音效增强等功能。

主要功能：

- 多种界面风格：十周年、移动版、一将成名、Online、欢乐三国杀、名将杀
- 卡牌美化：OL卡牌、彩色卡牌、十周年卡牌、手杀金卡等皮肤
- 动态皮肤：支持骨骼动画的动态武将皮肤
- 单独装备栏：独立的装备显示区域
- 进度条系统：回合进度条与阶段提示
- 音效增强：点击音效、技能音效等
- 出牌指示特效：多种目标指示动画

## 扩展结构

```
十周年UI/
├── extension.js              # 扩展入口文件
├── info.json                 # 扩展信息配置（名称、版本、作者等）
├── LICENSE                   # 许可证文件
│
├── src/                      # 源代码目录
│   ├── config.js             # 扩展配置选项定义
│   ├── content.js            # 主内容入口（游戏启动后执行）
│   ├── precontent.js         # 预加载内容（游戏启动前执行）
│   ├── package.js            # 包信息
│   │
│   ├── core/                 # 核心模块
│   │   ├── bootstrap.js      # 扩展启动引导
│   │   ├── decadeUI.js       # decadeUI核心对象
│   │   ├── decadeModule.js   # 模块管理
│   │   ├── layout.js         # 布局管理
│   │   ├── handler.js        # 事件处理
│   │   ├── hooks.js          # 钩子系统
│   │   ├── loader.js         # 资源加载
│   │   ├── sheet.js          # 样式表管理
│   │   └── ...
│   │
│   ├── animation/            # 动画模块
│   │   ├── AnimationPlayer.js    # 动画播放器
│   │   ├── DynamicPlayer.js      # 动态皮肤播放器
│   │   ├── gameIntegration.js    # 游戏动画集成
│   │   └── configs/              # 动画配置
│   │
│   ├── audio/                # 音频模块
│   │   ├── audioHooks.js     # 音频钩子
│   │   ├── enhancedAudio.js  # 增强音效
│   │   ├── skillDieAudio.js  # 技能/阵亡语音
│   │   └── easterEggs/       # 彩蛋音效
│   │
│   ├── effects/              # 特效模块
│   │   ├── line.js           # 出牌指示线特效
│   │   ├── kill.js           # 击杀特效
│   │   ├── skill.js          # 技能特效
│   │   └── dialog.js         # 对话框特效
│   │
│   ├── features/             # 功能模块
│   │   ├── autoSelect.js     # 自动选择
│   │   ├── cardDragSort.js   # 卡牌拖拽排序
│   │   ├── equipHand.js      # 装备栏处理
│   │   ├── equipAlone.js     # 单独装备栏
│   │   └── luckyCard.js      # 手气卡美化
│   │
│   ├── overrides/            # 覆盖/修复模块（对无名杀本体的修改）
│   │   ├── player.js         # 玩家相关
│   │   ├── card.js           # 卡牌相关
│   │   ├── dialog.js         # 对话框相关
│   │   ├── ui.js             # UI相关
│   │   └── ...
│   │
│   ├── skins/                # 皮肤模块
│   │   ├── dynamicSkin.js    # 动态皮肤（骨骼动画）
│   │   └── index.js
│   │
│   ├── ui/                   # UI组件
│   │   ├── progress-bar.js   # 进度条
│   │   ├── phase-tips.js     # 阶段提示
│   │   ├── cardPrompt.js     # 出牌信息提示
│   │   ├── cardStyles.js     # 卡牌样式
│   │   ├── gtbb.js           # 狗托播报
│   │   ├── component.js      # 通用组件
│   │   └── ...
│   │
│   ├── styles/               # CSS样式文件
│   │   ├── layout.css        # 布局样式
│   │   ├── card.css          # 卡牌样式
│   │   ├── player1~6.css     # 不同风格的玩家样式
│   │   ├── effect.css        # 特效样式
│   │   └── ...
│   │
│   ├── utils/                # 工具函数
│   │   ├── core.js           # 核心工具
│   │   ├── element.js        # DOM元素工具
│   │   ├── identity.js       # 身份相关工具
│   │   └── ...
│   │
│   └── libs/                 # 第三方库
│       ├── spine.js          # Spine骨骼动画库
│       └── eruda.js          # 调试工具
│
├── ui/                       # UI插件目录
│   ├── constants.js          # 常量定义
│   ├── utils.js              # 工具函数
│   │
│   ├── lbtn/                 # 左侧按钮插件
│   │   ├── plugin.js         # 插件入口
│   │   ├── chatSystem.js     # 聊天系统
│   │   ├── identityShow.js   # 身份显示
│   │   └── skins/            # 皮肤资源
│   │
│   ├── skill/                # 技能显示插件
│   │   ├── plugin.js         # 插件入口
│   │   └── skins/            # 皮肤资源
│   │
│   ├── character/            # 角色显示插件
│   │   ├── plugin.js         # 插件入口
│   │   ├── EnhancedInfoManager.js  # 增强信息管理
│   │   └── skins/            # 皮肤资源
│   │
│   ├── assets/               # UI资源
│   │   ├── fonts/            # 字体文件
│   │   ├── common/           # 通用资源
│   │   └── ...
│   │
│   └── styles/               # UI样式
│       ├── base.css          # 基础样式
│       └── fonts.css         # 字体样式
│
├── assets/                   # 资源文件
│   ├── animation/            # 骨骼动画资源（.atlas/.png/.skel）
│   │   ├── effect_*.skel     # 卡牌/技能特效动画
│   │   ├── SF_xuanzhong_*.skel   # 出牌指示特效
│   │   └── globaltexiao/     # 全局特效
│   │
│   └── image/                # 图片资源
│       ├── dialog*.png       # 对话框背景
│       ├── kb*.png           # 卡牌背景
│       ├── kuang*.png        # 卡牌边框
│       └── ...
│
├── audio/                    # 音频文件
│   ├── game_start.mp3        # 游戏开始音效
│   ├── card_click.mp3        # 卡牌点击音效
│   ├── SkillBtn.mp3          # 技能按钮音效
│   ├── kill_effect_sound.mp3 # 击杀音效
│   └── caidan/               # 菜单语音（武将台词）
│
└── image/                    # 图片资源
    ├── card/                 # 卡牌皮肤
    │   ├── online/           # OL卡牌
    │   ├── caise/            # 彩色卡牌
    │   ├── decade/           # 十周年卡牌
    │   ├── GoldCard/         # 手杀金卡
    │   └── bingkele/         # 哈基米卡牌
    │
    ├── decoration/           # 装饰资源（十周年风格）
    │   ├── border_*.png      # 边框
    │   ├── identity_*.png    # 身份牌
    │   ├── dead_*.png        # 阵亡标记
    │   └── ...
    │
    ├── decorations/          # 装饰资源（移动版风格）
    ├── decorationh/          # 装饰资源（欢乐风格）
    ├── decorationo/          # 装饰资源（OL风格）
    ├── decoration_code/      # 装饰资源（名将杀风格）
    │
    ├── button/               # 按钮资源
    ├── identityCard/         # 身份卡牌
    ├── judgeMark/            # 判定标记
    ├── mark/                 # 武将标记（SP、OL、界等）
    └── vcard/                # 虚拟卡牌资源
```

## 使用方法

### 安装

1. 下载扩展文件
2. 将整个文件夹放入无名杀的 `extension` 目录下
3. 重启游戏，在扩展列表中启用"十周年UI"

### 布局推荐

在 游戏选项 → 外观 → 布局 中选择"新版布局"以获得最佳体验。

## 技术信息

**开发语言**：JavaScript (ES6+ Modules)

**依赖环境**：

- 无名杀 1.11.0 或更高版本
- Chrome 91+ 或基于 Chromium 的浏览器

**扩展类型**：界面美化扩展（type: "extension"）

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

- 扩展仓库：https://github.com/diandian157/decadeUI
- 无名杀本体：https://github.com/libnoname/noname

## 相关人员

- 原创作者：短歌
- 手杀UI原作者：橙续缘
- 上任维护者：萌新(转型中)
- 当前维护者：点点

## 许可证

GPL-3.0
