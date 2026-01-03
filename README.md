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
│   │   ├── app.js            # 应用入口
│   │   ├── bootstrap.js      # 扩展启动引导
│   │   ├── decadeUI.js       # decadeUI核心对象
│   │   ├── decadeModule.js   # 模块管理
│   │   ├── layout.js         # 布局管理
│   │   ├── handler.js        # 事件处理
│   │   ├── hooks.js          # 钩子系统
│   │   ├── loader.js         # 资源加载
│   │   ├── sheet.js          # 样式表管理
│   │   ├── dialog.js         # 对话框管理
│   │   ├── constants.js      # 常量定义
│   │   ├── environment.js    # 环境检测
│   │   ├── animate.js        # 动画工具
│   │   ├── create.js         # 创建工具
│   │   ├── debug.js          # 调试工具
│   │   ├── connectMode.js    # 联机模式
│   │   ├── getters.js        # 属性获取器
│   │   ├── setters.js        # 属性设置器
│   │   ├── statics.js        # 静态方法
│   │   ├── utility.js        # 工具方法
│   │   └── resize-sensor.js  # 尺寸监听
│   │
│   ├── animation/            # 动画模块
│   │   ├── index.js          # 模块入口
│   │   ├── AnimationPlayer.js    # 动画播放器
│   │   ├── AnimationPlayerPool.js # 动画播放器池
│   │   ├── APNode.js         # 动画节点
│   │   ├── DynamicPlayer.js  # 动态皮肤播放器
│   │   ├── dynamicWorker.js  # 动态皮肤Worker
│   │   ├── gameIntegration.js # 游戏动画集成
│   │   ├── initAnimations.js # 动画初始化
│   │   ├── TimeStep.js       # 时间步进
│   │   ├── easing.js         # 缓动函数
│   │   ├── utils.js          # 动画工具
│   │   └── configs/          # 动画配置
│   │
│   ├── audio/                # 音频模块
│   │   ├── index.js          # 模块入口
│   │   ├── audioHooks.js     # 音频钩子
│   │   ├── enhancedAudio.js  # 增强音效
│   │   ├── skillDieAudio.js  # 技能/阵亡语音
│   │   └── easterEggs/       # 彩蛋音效
│   │
│   ├── effects/              # 特效模块
│   │   ├── index.js          # 模块入口
│   │   ├── config.js         # 特效配置
│   │   ├── line.js           # 出牌指示线特效
│   │   ├── kill.js           # 击杀特效
│   │   ├── skill.js          # 技能特效
│   │   └── utils.js          # 特效工具
│   │
│   ├── features/             # 功能模块
│   │   ├── autoSelect.js     # 自动选择
│   │   ├── cardDragSort.js   # 卡牌拖拽排序
│   │   ├── equipHand.js      # 装备栏处理
│   │   ├── equipAlone.js     # 单独装备栏
│   │   ├── equipCopy.js      # 装备复制
│   │   ├── luckyCard.js      # 手气卡美化
│   │   ├── extensionToggle.js # 扩展开关
│   │   └── styleHotkeys.js   # 样式快捷键
│   │
│   ├── overrides/            # 覆盖/修复模块（对无名杀本体的修改）
│   │   ├── index.js          # 模块入口
│   │   ├── player.js         # 玩家相关
│   │   ├── card.js           # 卡牌相关
│   │   ├── dialog.js         # 对话框相关
│   │   ├── ui.js             # UI相关
│   │   ├── game.js           # 游戏相关
│   │   ├── get.js            # 获取方法
│   │   ├── lib.js            # 库方法
│   │   ├── event.js          # 事件相关
│   │   ├── control.js        # 控制相关
│   │   ├── content.js        # 内容相关
│   │   └── moveAnimFix.js    # 移动动画修复
│   │
│   ├── skills/               # 技能模块
│   │   └── index.js          # 技能入口
│   │
│   ├── skins/                # 皮肤模块
│   │   ├── index.js          # 模块入口
│   │   └── dynamicSkin.js    # 动态皮肤（骨骼动画）
│   │
│   ├── ui/                   # UI组件
│   │   ├── progress-bar.js   # 进度条
│   │   ├── phase-tips.js     # 阶段提示
│   │   ├── cardPrompt.js     # 出牌信息提示
│   │   ├── cardStyles.js     # 卡牌样式
│   │   ├── card-element.js   # 卡牌元素
│   │   ├── card-utils.js     # 卡牌工具
│   │   ├── cardAlternateName.js # 卡牌别名
│   │   ├── gtbb.js           # 狗托播报
│   │   ├── component.js      # 通用组件
│   │   ├── handtip.js        # 手牌提示
│   │   ├── skillDisplay.js   # 技能显示
│   │   ├── player-element.js # 玩家元素
│   │   ├── player-group.js   # 玩家分组
│   │   ├── player-init.js    # 玩家初始化
│   │   ├── character-button.js # 角色按钮
│   │   ├── characterBackground.js # 角色背景
│   │   ├── characterNamePrefix.js # 角色名前缀
│   │   ├── outcropAvatar.js  # 头像溢出
│   │   ├── prefixMark.js     # 前缀标记
│   │   ├── layout-init.js    # 布局初始化
│   │   └── layout-utils.js   # 布局工具
│   │
│   ├── styles/               # CSS样式文件
│   │   ├── layout.css        # 布局样式
│   │   ├── decadeLayout.css  # 十周年布局
│   │   ├── card.css          # 卡牌样式
│   │   ├── player1~6.css     # 不同风格的玩家样式
│   │   ├── effect.css        # 特效样式
│   │   ├── dialog.css        # 对话框样式
│   │   ├── equip.css         # 装备样式
│   │   ├── menu.css          # 菜单样式
│   │   ├── component.css     # 组件样式
│   │   ├── animation.css     # 动画样式
│   │   ├── icon.css          # 图标样式
│   │   ├── extension.css     # 扩展样式
│   │   └── meihua.css        # 梅花样式
│   │
│   ├── utils/                # 工具函数
│   │   ├── core.js           # 核心工具
│   │   ├── element.js        # DOM元素工具
│   │   ├── identity.js       # 身份相关工具
│   │   ├── bounds.js         # 边界计算
│   │   └── version.js        # 版本工具
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
│   │   ├── entry.js          # 入口文件
│   │   ├── loader.js         # 加载器
│   │   ├── controls.js       # 控制逻辑
│   │   ├── chatSystem.js     # 聊天系统
│   │   ├── identityShow.js   # 身份显示
│   │   └── skins/            # 样式资源
│   │
│   ├── skill/                # 技能显示插件
│   │   ├── plugin.js         # 插件入口
│   │   ├── entry.js          # 入口文件
│   │   ├── loader.js         # 加载器
│   │   └── skins/            # 样式资源
│   │
│   ├── character/            # 角色显示插件
│   │   ├── plugin.js         # 插件入口
│   │   ├── entry.js          # 入口文件
│   │   ├── loader.js         # 加载器
│   │   ├── EnhancedInfoManager.js  # 增强信息管理
│   │   └── skins/            # 样式资源
│   │
│   ├── assets/               # UI资源
│   │   ├── fonts/            # 字体文件
│   │   ├── common/           # 通用资源
│   │   ├── character/        # 角色资源
│   │   ├── chat/             # 聊天资源
│   │   ├── identity/         # 身份资源
│   │   ├── lbtn/             # 左侧按钮资源
│   │   └── skill/            # 技能资源
│   │
│   └── styles/               # UI样式
│       ├── base.css          # 基础样式
│       ├── fonts.css         # 字体样式
│       ├── character/        # 角色样式
│       ├── lbtn/             # 左侧按钮样式
│       └── skill/            # 技能样式
│
├── assets/                   # 资源文件
│   ├── animation/            # 骨骼动画资源（.atlas/.png/.skel）
│   │   ├── effect_*.skel     # 卡牌/技能特效动画
│   │   ├── SF_xuanzhong_*.skel   # 出牌指示特效
│   │   ├── Ss_*.skel         # 手杀特效动画
│   │   ├── SSHW_TX_*.skel    # 手杀幻武特效
│   │   └── globaltexiao/     # 全局特效
│   │
│   └── dynamic/              # 动态样式资源
│
├── audio/                    # 音频文件
│   ├── game_start.mp3        # 游戏开始音效
│   ├── game_start_shousha.mp3 # 手杀游戏开始音效
│   ├── card_click.mp3        # 卡牌点击音效
│   ├── SkillBtn.mp3          # 技能按钮音效
│   ├── BtnSure.mp3           # 确认按钮音效
│   ├── Gamepress.mp3         # 游戏按压音效
│   ├── GameShowCard.mp3      # 展示卡牌音效
│   ├── kill_effect_sound.mp3 # 击杀音效
│   ├── hpLossSund.mp3        # 扣血音效
│   ├── seatRoundState_start.mp3 # 回合开始音效
│   └── caidan/               # 彩蛋语音
│
└── image/                    # 图片资源
    ├── card-skins/           # 卡牌样式
    │   ├── online/           # OL卡牌
    │   ├── caise/            # 彩色卡牌
    │   ├── decade/           # 十周年卡牌
    │   ├── gold/             # 手杀金卡
    │   └── bingkele/         # 哈基米卡牌
    │
    ├── character/            # 角色图片
    │   ├── dcloutou/         # 十周年头像
    │   ├── ssloutou/         # 手杀头像
    │   └── lihui/            # 立绘资源
    │
    ├── styles/               # 风格装饰资源
    │   ├── decade/           # 十周年风格
    │   ├── shousha/          # 手杀风格
    │   ├── online/           # OL风格
    │   ├── xinsha/           # 新杀风格
    │   ├── baby/             # 欢乐风格
    │   └── codename/         # 名将杀风格
    │
    └── ui/                   # UI图片资源
        ├── button/           # 按钮资源
        ├── card/             # 卡牌资源
        ├── card-base/        # 卡牌底图
        ├── chain/            # 铁索连环
        ├── dialog/           # 对话框背景
        ├── effects/          # 特效图片
        ├── frame/            # 边框资源
        ├── identity-card/    # 身份卡牌
        ├── judge-mark/       # 判定标记
        ├── mark/             # 武将标记（SP、OL、界等）
        ├── mask/             # 遮罩资源
        ├── misc/             # 杂项资源
        ├── player-bg/        # 玩家背景
        ├── rarity/           # 稀有度标记
        └── tnode/            # 节点资源
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
