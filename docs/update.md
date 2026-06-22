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
| 普通 Spine 全屏特效 | `decadeUI-canvas` | 10 | 技能、卡牌及外部扩展特效 |
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

这些接口仅用于旧扩展过渡。新扩展不要覆写 `player.playDynamic`、`stopDynamic` 或 `player.dynamic`，也不要自行实例化逐人物 `DynamicPlayer`。推荐写法见 [动态皮肤与扩展兼容 API](dynamic-skin-api.md)。

## 八、缩放与 resize

- 新增“缩放兼容”开关，说明为“骨骼动画缩放补偿，当缩放异常时打开”，默认关闭。
- 仅在旧扩展受 `game.documentZoom` 影响而出现异常缩放时开启补偿。
- 人物动皮、普通 Spine 共享层和动态背景均会响应页面 resize。
- 修复共享 Canvas 在 CSS zoom、DPR 和窗口尺寸变化后的坐标、遮罩和视觉大小问题。
- 手机端全屏特效和动态背景按 `1280×720` 设计画布与当前可视区域等比缩小，再应用 `0.8` 的移动端视觉补偿，并响应旋转和 resize。

## 九、清理与其他修复

- 删除未被加载或引用的旧 `静dynamicSkin.js`、`skinChange.js`。
- 增加 WebGL context 丢失后的资源恢复和渲染重启处理。
- 修复 atlas region 缺失导致 Promise 链直接中断的问题。
- 普通 Spine 与人物动皮明确分层：外部扩展通过十周年UI播放普通 Spine 时默认进入全屏特效层，播放动皮时进入人物动皮层。
- 补充普通 Spine、人物动皮、新旧 API 和换肤扩展重构文档。
