# 动态皮肤配置说明

本章节将介绍十周年UI的动态皮肤系统配置方法。

## 一、功能说明

动态皮肤是基于Spine骨骼动画的武将皮肤系统，可以让武将立绘动起来。

- 打开动态皮肤开关后直接替换原有武将皮肤
- 动态皮肤参数表：https://docs.qq.com/sheet/DS2Vaa0ZGWkdMdnZa
- 相关文件放到 `十周年UI/assets/dynamic` 目录下

启用条件：在十周年UI设置中开启“动态皮肤”。《皮肤切换》和《千幻聆音》不是播放动皮的必需依赖；安装后可提供出框动作、静态皮肤、语音和换肤界面等额外能力。

## 二、文件位置

| 文件类型     | 位置                       |
| ------------ | -------------------------- |
| 参数配置文件 | `src/skins/dynamicSkin.js` |
| 骨骼资源文件 | `assets/dynamic/`          |

## 三、配置格式

编辑 `src/skins/dynamicSkin.js` 中的 `dynamicSkinConfig` 对象：

```javascript
武将名: {
  皮肤名: {
    name: "xxx",           // 必填，骨骼名称（不带.skel后缀）
    action: "xxx",         // 播放动作，一般是 DaiJi
    x: [10, 0.5],          // left: calc(10px + 50%)，默认[0, 0.5]
    y: [10, 0.5],          // bottom: calc(10px + 50%)，默认[0, 0.5]
    scale: 0.5,            // 缩放大小，默认1
    angle: 0,              // 旋转角度，默认0
    speed: 1,              // 播放速度，默认1
    hideSlots: [],         // 隐藏的部件
    clipSlots: [],         // 裁剪的部件（仅露头动皮）
    background: "xxx.jpg", // 背景图片
  }
}
```

## 四、资源文件

### 1. 文件结构

每个动态皮肤需要三个文件：

```
assets/dynamic/
└── 武将名/
    └── 皮肤名/
        ├── xxx.skel    # 骨骼数据文件
        ├── xxx.atlas   # 图集描述文件
        └── xxx.png     # 纹理图片
```

### 2. 路径对应关系

`name` 参数对应 `assets/dynamic/` 下的路径：

| name 参数              | 实际文件路径                               |
| ---------------------- | ------------------------------------------ |
| `mychar/默认/daiji`    | `assets/dynamic/mychar/默认/daiji.skel`    |
| `卢弈/姝丽风华/daiji2` | `assets/dynamic/卢弈/姝丽风华/daiji2.skel` |

## 五、添加新动皮

### 第一步：准备Spine骨骼文件

- 使用Spine软件导出骨骼动画
- 导出格式：二进制(.skel) + 图集(.atlas + .png)
- 支持多版本 Spine runtime。建议填写 `version`；未填写时由共享渲染器检测资源版本。

### 第二步：放置资源文件

```
assets/dynamic/mychar/皮肤名/
├── daiji.skel
├── daiji.atlas
└── daiji.png
```

### 第三步：添加参数配置

编辑 `src/skins/dynamicSkin.js`：

```javascript
export const dynamicSkinConfig = {
	mychar: {
		皮肤名: {
			name: "mychar/皮肤名/daiji",
			x: [0, 0.5],
			y: [0, 0.45],
			scale: 0.8,
			speed: 1,
		},
	},
};
```

### 第四步：共享皮肤（可选）

在 `setupDynamicSkin` 函数中添加共享配置：

```javascript
const dynamicSkinExtend = {
	re_luyi: decadeUI.dynamicSkin.luyi,
};
decadeUI.get.extend(decadeUI.dynamicSkin, dynamicSkinExtend);
```

## 六、配置示例

```javascript
luyi: {
  姝丽风华: {
    name: "卢弈/姝丽风华/daiji2",
    shan: "play3",
    x: [0, 0.438],
    y: [0, 0.396],
    angle: -2,
    scale: 1.07,
    shizhounian: true,
    // 出场动画
    chuchang: {
      name: "卢弈/姝丽风华/chuchang",
      x: [0, 0.777],
      y: [0, 0.36],
      scale: 0.7,
      action: "play",
    },
    // 攻击动画
    gongji: {
      name: "卢弈/姝丽风华/chuchang2",
      x: [0, 0.812],
      y: [0, 0.254],
      scale: 0.8,
      action: "gongji",
    },
    // 特殊技能动画
    teshu: {
      name: "卢弈/姝丽风华/chuchang2",
      x: [0, 0.812],
      y: [0, 0.254],
      scale: 0.8,
      action: "jineng",
    },
    // 背景动画
    beijing: {
      name: "卢弈/姝丽风华/beijing",
      x: [0, 0.29],
      y: [0, 0.5],
      scale: 0.4,
    },
    // 指示线特效
    zhishixian: {
      name: "卢弈/姝丽风华/shouji2",
      scale: 0.5,
      speed: 0.8,
      delay: 0.4,
      effect: {
        name: "卢弈/姝丽风华/shouji",
        scale: 0.5,
        speed: 0.8,
        delay: 0.25,
      },
    },
  },
}
```

## 七、调试方法

控制台执行：

```javascript
// 停止当前动皮
game.me.stopDynamic();

// 测试新配置
game.me.playDynamic({
	name: "xxx",
	loop: true,
	x: [0, 0.5],
	y: [0, 0.5],
	scale: 0.5,
	angle: 0,
	speed: 1,
	hideSlots: [],
	clipSlots: [],
});
```

## 八、注意事项

1. 动态皮肤需要WebGL支持，部分老旧设备可能无法使用
2. 同时显示的动皮数量过多会造成严重卡顿
3. 同一套资源的 `.skel/.json`、`.atlas` 和纹理必须来自匹配的 Spine 导出版本
4. 大尺寸纹理图片会影响性能，建议优化图片大小

## 九、当前播放架构与 Canvas 分层

新版十周年UI不再为每个人物创建一个 WebGL Canvas，而是由共享渲染器统一管理节点和容器。

| 用途 | Canvas | 推荐入口 |
| --- | --- | --- |
| 人物动态皮肤 | `decadeUI-canvas-dynamic-player` | `player.playDynamic()`、`decadeUI.playDynamicTo()` |
| 普通 Spine/全屏特效 | `decadeUI-canvas` | `decadeUI.playSpine()` |
| 底背景动态动画 | `decadeUI-canvas-background` | 十周年UI动态背景设置 |

外部扩展不要再为每个人物创建 `new DynamicPlayer()`、`new AnimationPlayer()` 或自行向人物 DOM 插入 `.animation-player` Canvas。这样会绕过多版本 runtime、缩放、resize、层级管理和资源容错。

《皮肤切换》的攻击/出场出框动画目前仍使用它自己创建并交给 Worker 的 `chukuang-canvas`。这是独立的全屏出框播放器，不能把已经绑定 WebGL 的 `decadeUI-canvas` 再 `transferControlToOffscreen()`。人物框内的待机动皮仍必须由十周年UI共享动皮层播放。

## 十、新扩展推荐 API

### 1. 给游戏玩家播放动皮

这是最简洁的正式入口，也会执行十周年UI与皮肤切换的生命周期兼容：

```javascript
const skin = {
	name: "武将/皮肤/daiji",
	action: "DaiJi",
	version: "4.0",
	x: [0, 0.5],
	y: [0, 0.5],
	scale: 0.35,
	beijing: {
		name: "武将/皮肤/beijing",
		action: "play",
		version: "4.0",
		scale: 0.35,
	},
	background: "武将/皮肤/static_bg.png",
};

// 主将
game.me.playDynamic(skin, false);

// 副将
game.me.playDynamic(skin, true);

// 只停止主将 / 只停止副将 / 全部停止
game.me.stopDynamic(true, false);
game.me.stopDynamic(false, true);
game.me.stopDynamic();
```

播放后可通过以下稳定字段读取当前状态：

```javascript
const dynamic = game.me.dynamic;
const primaryHandle = dynamic.primary;
const deputyHandle = dynamic.deputy;
const fullSkinConfig = primaryHandle?.player;
```

不要替换 `player.dynamic`，也不要覆写 `lib.element.player.playDynamic/stopDynamic`。需要换肤时再次调用 `player.playDynamic(newSkin, isDeputy)`，共享播放器会停止对应槽位并原位替换。

### 2. 在换肤预览等普通 DOM 中播放动皮

```javascript
const playback = decadeUI.playDynamicTo(previewElement, skin, {
	isDeputy: false,
});

// 停止本次播放
playback.stop();

// 销毁该预览元素的全部共享动皮容器
playback.destroy();
// 也可以调用 decadeUI.stopDynamicTo(previewElement)
```

此入口仍使用全局共享动皮 Canvas，只为 `previewElement` 创建逻辑容器，不创建新的 WebGL Canvas。

### 3. 配置对象必须完整传递

换肤扩展不要只传 `name/x/y/scale`。`gongji`、`chuchang`、`teshu`、`special`、`beijing`、`qianjing`、`audio`、`shizhounian` 等字段是动作扩展和皮肤切换初始化所需的协议数据。

```javascript
// 推荐：复制完整配置，必要时只覆盖位置参数
const nextSkin = {
	...sourceSkin,
	x: editedX,
	y: editedY,
	scale: editedScale,
	player: sourceSkin,
};

player.playDynamic(nextSkin, isDeputy);
```

`handle.player` 应保留完整原始配置，供动作、变身、语音和出框扩展读取。

## 十一、动作与出框扩展的重构建议

类似《皮肤切换》的扩展后续重构时，建议按以下边界拆分：

1. 十周年UI负责人物框内待机动皮、动态背景、双将裁剪、resize 和 Canvas 层级；尚未迁入共享层的附加前景仍由扩展按自身能力处理。
2. 换肤扩展负责选择配置、静态皮肤和语音映射。
3. 出框扩展可以保留独立全屏 Worker Canvas，但资源参数直接读取 `player.dynamic.primary.player` 或 `deputy.player`。
4. 换肤时调用 `player.playDynamic(fullConfig, isDeputy)`，不要创建或替换 `DynamicPlayer`。
5. 攻击/出场前隐藏人物框内动皮，播放结束后恢复待机；兼容期可使用下述旧消息协议，新代码应把这部分封装在扩展自己的动作控制器中，不要接管十周年UI renderer。

`chuchang` 有两种常见形式：

- `shizhounian: true`：通常由独立 `chuchang` 骨骼在出框 Canvas 播放。
- 非 `shizhounian`：可能是主骨骼内的 `ChuChang` action，应非循环播放一次后回到 `DaiJi/play/idle`。

不要把 `chuchang` 或 `gongji` 固定设为人物框内的循环 action。

## 十二、为旧扩展保留的兼容接口

以下能力是为了《皮肤切换》《千幻聆音》等依赖旧十周年UI实现的扩展保留，不建议新扩展据此设计：

- `player.dynamic.id`、`primary`、`deputy`、`handle.id`、`handle.player`。
- `player.dynamic.renderer.postMessage(message)` 旧 Worker 风格消息入口。
- `ACTION`、`SHOW`、`HIDE`、`HIDE2`、`hideAllNode`、`recoverDaiJi`、`RESIZE`、`ADJUST`、`changeSkelSkin`、`CHANGE_ACTION`、`UPDATE`、`StartPlay` 消息。
- `loadFinish → StartPlay → playSkinEnd` 旧播放器生命周期事件。
- `hideAllNodeEnd` 回执，用于出框 Canvas 开始播放前的握手。
- `lib.qhly_playdynamic/lib.qhly_stopdynamic`，用于把千幻旧预览调用转入共享播放器。
- `lib.element.player.playDynamic/stopDynamic` 的加载顺序守卫，防止外部扩展重新替换为逐人物 Canvas 播放器。

旧消息示例仅用于维护现有扩展：

```javascript
player.dynamic.renderer.postMessage({
	message: "ACTION",
	id: player.dynamic.id,
	skinID: player.dynamic.primary.id,
	action: "GongJi",
});
```

新扩展应优先调用 `player.playDynamic()` 或 `decadeUI.playDynamicTo()`，不要把 `renderer.postMessage` 当作新 API。

## 十三、兼容行为与排错

- 共享 renderer 会自动检测 Spine runtime，并对 atlas 缺失 region 使用透明占位，避免单个附件导致整套动皮中断。
- 动态背景和人物动皮均支持页面 resize。
- “缩放兼容”开关默认关闭。当安装了《皮肤切换》等会劫持 `getBoundingClientRect` 或修改 `documentZoom` 行为的扩展，且 `game.documentZoom ≠ 1` 时出现动皮/特效缩放偏大、定位错乱的情况，可打开此开关进行兼容。这是一个**权宜之计**，根本原因是部分扩展的坐标计算未适配 `documentZoom ≠ 1` 的场景（例如混合使用视觉像素与布局像素）。希望相关扩展尽快更新代码修复坐标基准问题，届时此开关可移除。
- 若错误堆栈仍出现 `DynamicPlayer.js → AnimationPlayer.js`，说明扩展仍在实例化旧逐 Canvas 播放器，没有进入共享 API。
- 若出现 `renderer.postMessage is not a function`，说明外部扩展保存或替换了非共享 `player.dynamic`；不要覆盖该对象。

---

# 十周年UI 本次改动说明

本次更新重点重构骨骼动画基础设施。目标是减少 WebGL Canvas 和上下文数量，统一 Spine/SK 播放方式，并为《皮肤切换》《千幻聆音》等依赖旧十周年UI动皮接口的扩展提供迁移兼容。

## 一、Spine 与 SK 播放能力

- 新增统一 Spine 渲染器，支持普通特效、人物动皮、动态背景和预览器复用同一套资源加载与节点管理逻辑。
- 增加 SK 龙骨播放能力，卡牌动画可以在 Spine 和 SK 龙骨之间切换。
- 普通 Spine 默认进入全屏特效层 `decadeUI-canvas`。
- 人物动态皮肤默认进入人物动皮层 `decadeUI-canvas-dynamic-player`。
- 对外增加 `decadeUI.playSpine()`、`loopSpine()`、`stopSpine()`、`stopSpineAll()`。
- 人物动皮继续支持 `player.playDynamic()`，并增加适合换肤预览 DOM 的 `decadeUI.playDynamicTo()`。

## 二、Spine/SK 预览器

- 新增“预览 Spine/SK 动画”设置入口。
- 可选择开启“顶部菜单显示 Spine/SK 预览器”，开启后游戏顶部会出现“Spine/SK预览”按钮。
- 预览器可以浏览十周年UI资源目录，识别 Spine 和 SK 资源并直接播放。
- Spine 预览支持动作切换、缩放、横纵偏移、旋转、透明度和播放速度调整。
- 可用于检查资源是否完整、确认骨骼版本、查找 action 名称，以及调试动皮和特效参数。

## 三、多版本 Spine runtime

- 新增 Spine 3.7、3.8、4.0、4.1 runtime 支持。
- 当前共享渲染器同时保留 3.5.35、3.6 和 4.2 的兼容路由。
- 支持 `.skel` 和 `.json` 骨骼数据。
- 未填写 `version` 时会读取骨骼数据自动检测版本；明确知道版本时仍建议在配置中填写。
- 各版本 runtime 使用独立命名空间，降低与其他扩展修改 `window.spine` 产生冲突的概率。
- 增加 atlas 非标准字段、UTF-8 路径和缺失 region 容错；单个附件缺失时使用透明占位，避免整套动画直接中断。

## 四、Canvas 合并与分层

旧逻辑会在人物、卡牌或预览 DOM 上反复创建 Canvas，容易触发浏览器 WebGL 上下文上限。本次改为“每个职责层一个共享 Canvas”，DOM 只创建逻辑容器：

| 层 | Canvas | 默认层级 | 用途 |
| --- | --- | ---: | --- |
| 底层动态内容 | `decadeUI-canvas-dynamic-bottom` | 1 | 底层人物/背景扩展 |
| 人物动态皮肤 | `decadeUI-canvas-dynamic-player` | 5 | 主将、副将待机动皮 |
| 普通 Spine 全屏特效 | `decadeUI-canvas` | 12 | 技能、卡牌及外部扩展特效 |
| 动态底背景 | `decadeUI-canvas-background` | -1 | 页面底背景动画 |

- 多个人物动皮共享人物动皮 Canvas，通过容器绑定到各自人物 DOM。
- 普通特效共享全屏特效 Canvas，相对人物或卡牌播放时不再创建新 Canvas。
- Canvas 和内部容器会随窗口 resize 更新尺寸和定位。
- 资源按引用计数复用和释放，减少重复加载、WebGL context 和显存占用。

这里的“合并 Canvas”不是把所有内容强塞进同一个层，而是取消逐人物、逐 DOM Canvas，按底层、人物、全屏特效和背景职责保留必要的共享层。

## 五、人物层级大幅下调

- 人物动态皮肤层调整到 `z-index: 5`，底层动态内容调整到 `z-index: 1`。
- 普通全屏特效保持在人物动皮之上，避免攻击、技能和卡牌特效被人物骨骼遮挡。
- 动态背景固定在页面底层，不参与人物和交互 UI 的层级竞争。
- Canvas 全部设置 `pointer-events: none`，不会阻挡选牌、点击人物或菜单交互。

## 六、动态背景回归

- 设置中恢复“动态背景”选项，当前选项由 `src/skins/dynamicBackground.js` 的 `dynamicBackgroundConfig` 自动生成。
- 当前内置“关闭”“曹金玉-瓷语青花”“赵襄-月痕芳影”。
- 配置支持主体骨骼和 `beijing` 背景骨骼分层播放。
- 动态背景使用独立底背景 Canvas，支持窗口 resize。
- 修复 `game.documentZoom` 导致的背景骨骼视觉缩放异常，使不同页面缩放下保持接近的显示尺寸。
- 增加异步切换保护：快速切换背景时，旧资源加载完成后不会覆盖新选择。

使用方法：进入“十周年UI设置 → 外观 → 动态背景”，选择配置名称；选择“关闭”即可停止并清空动态背景。

新增背景时编辑 `src/skins/dynamicBackground.js`：

```javascript
export const dynamicBackgroundConfig = {
	"显示名称": {
		name: "武将/皮肤/daiji",
		action: "play",
		version: "4.0",
		x: [0, 0.5],
		y: [0, 0.5],
		scale: 1.5,
		beijing: {
			name: "武将/皮肤/beijing",
			action: "play",
			version: "4.0",
			x: [0, 0.5],
			y: [0, 0.5],
			scale: 1.5,
		},
	},
};
```

资源路径相对于 `十周年UI/assets/dynamic/`，无需填写 `.skel/.json/.atlas` 后缀。

## 七、动态皮肤与旧扩展兼容

- 为《皮肤切换》保留 `player.dynamic.id/primary/deputy`、`handle.player` 和旧 Worker 风格 `renderer.postMessage()` 门面。
- 兼容 `ACTION`、`CHANGE_ACTION`、显示/隐藏、恢复待机、位置调整、Skeleton skin 切换等旧消息。
- 补回 `loadFinish → StartPlay → playSkinEnd` 和 `hideAllNodeEnd` 生命周期握手。
- 播放动皮后统一调用皮肤切换的 `chukuangPlayerInit()`，让 `chuchang`、`gongji`、`teshu`、`special` 等配置能够继续预加载到出框 Worker。
- 区分独立出场骨骼和主骨骼 `ChuChang` action；非循环播放出场后恢复 `DaiJi/play/idle`。
- 为《千幻聆音》保留 `lib.qhly_playdynamic/lib.qhly_stopdynamic`，并阻止其把游戏人物重新切回逐人物旧 Canvas 播放器。
- 旧播放器已开始播放的游戏人物会迁移到共享人物动皮层。
- 静态背景、动态 `beijing` 和完整皮肤配置会继续传给动作、语音和换肤扩展读取。

这些接口仅用于旧扩展过渡。新扩展不要覆写 `player.playDynamic`、`stopDynamic` 或 `player.dynamic`，也不要自行实例化逐人物 `DynamicPlayer`。推荐写法见上文“十、新扩展推荐 API”。

## 八、缩放与 resize

- 新增“缩放兼容”开关，默认关闭。
- 当安装了《皮肤切换》等会劫持 `getBoundingClientRect` 或修改 `documentZoom` 行为的扩展，且 `game.documentZoom ≠ 1` 时出现动皮/特效缩放偏大、定位错乱的情况，打开此开关可进行兼容。这是**权宜之计**，根本原因是部分扩展的坐标计算未适配 `documentZoom ≠ 1` 的场景。希望相关扩展尽快更新代码，届时此开关可移除。
- 人物动皮、普通 Spine 共享层和动态背景均会响应页面 resize。
- 修复共享 Canvas 在 CSS zoom、DPR 和窗口尺寸变化后的坐标、遮罩和视觉大小问题。
- 手机端全屏特效和动态背景按 `1280×720` 设计画布与当前可视区域等比缩小，再应用 `0.8` 的移动端视觉补偿，并响应旋转和 resize。

## 九、清理与其他修复

- 增加 WebGL context 丢失后的资源恢复和渲染重启处理。
- 修复 atlas region 缺失导致 Promise 链直接中断的问题。
- 普通 Spine 与人物动皮明确分层：外部扩展通过十周年UI播放普通 Spine 时默认进入全屏特效层，播放动皮时进入人物动皮层。
- 补充普通 Spine、人物动皮、新旧 API 和换肤扩展重构文档。
