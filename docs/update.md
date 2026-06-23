# 十周年UI 本次改动说明

本次更新重点重构骨骼动画基础设施。目标是减少 WebGL Canvas 和上下文数量，统一 Spine/SK 播放方式，并为《皮肤切换》《千幻聆音》等依赖旧十周年UI动皮接口的扩展提供迁移兼容。详细说明见 [动态皮肤与扩展兼容 API](dynamic-skin-api.md)。

## 一、Spine 与 SK 播放能力

新增统一 Spine 渲染器，支持普通特效、人物动皮、动态背景和预览器复用同一套资源加载与节点管理逻辑；增加 SK 龙骨播放能力。

SK 龙骨通过 `decadeUI.playSkel()` 播放，其他扩展可直接调用：

```javascript
// 播放 SK 龙骨动画，path 相对于十周年UI扩展目录或填完整 URL
// 返回 LayaSkInstance 实例（Promise）
const sk = await decadeUI.playSkel("sk/mychar/daiji", {
	loop: true,           // 是否循环，默认 false
	scale: 1,             // 缩放，默认 1
	speed: 1,             // 播放速度，默认 1
	alpha: 1,             // 透明度，默认 1
	pos: playerElement,   // 跟随的 DOM 元素，或 [x, y] 固定坐标
	offset: { x: 0, y: 0 }, // 偏移量
	onReady: () => {},    // 加载完成回调
	onPlay: () => {},     // 开始播放回调
	onEnd: () => {},      // 播放结束回调
});

// 停止播放
sk.end();
// 或通过 LayaAnimationsManager 停止
decadeUI.LayaAnimationsManager.clearSkel(sk);
```

SK 资源放在 `十周年UI/sk/` 目录下，无需手动加载 Laya 运行时，`playSkel` 会自动按需加载。

## 二、Spine/SK 预览器

新增“预览 Spine/SK 动画”设置入口，可浏览资源目录并直接播放，支持动作切换、缩放、偏移、旋转、透明度和播放速度调整。

## 三、多版本 Spine runtime

新增 Spine 3.7、3.8、4.0、4.1 runtime 支持，保留 3.5.35、3.6 和 4.2 兼容路由；支持 `.skel` 和 `.json`，未填写 `version` 时自动检测。

## 四、Canvas 合并与分层

改为“每个职责层一个共享 Canvas”，取消逐人物、逐 DOM Canvas，按底层、人物、全屏特效和背景职责保留必要的共享层。

## 五、人物层级大幅下调

人物动态皮肤层调整到 `z-index: 5`，普通全屏特效保持在人物动皮之上，Canvas 全部设置 `pointer-events: none`。

## 六、动态背景回归

设置中恢复“动态背景”选项，配置由 `src/skins/dynamicBackground.js` 自动生成，支持主体骨骼和 `beijing` 背景骨骼分层播放。

## 七、动态皮肤与旧扩展兼容

为《皮肤切换》《千幻聆音》保留旧 Worker 风格消息接口、生命周期握手和 `lib.qhly_playdynamic` 等兼容入口。

## 八、缩放与 resize

新增“缩放兼容”开关（默认关闭），仅在旧扩展导致 `game.documentZoom ≠ 1` 时出现异常缩放时开启；人物动皮、普通 Spine 共享层和动态背景均会响应页面 resize。

## 九、清理与其他修复

增加 WebGL context 丢失恢复，修复 atlas region 缺失导致 Promise 链中断等问题。
