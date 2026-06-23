/**
 * SpineRenderer - Spine 渲染器
 * 复用皮肤切换的多版本 spine 运行时（spine/spine_4/spine_4_1/spine_4_2 等）
 * 自动检测骨骼版本，按版本使用对应运行时加载/创建/渲染
 */

import { SpineMask } from "./SpineMask.js";
import { game, get } from "noname";

// 版本 → 全局 spine 库变量映射（tl_ 前缀独立命名空间，彻底避免与其他扩展冲突）
// 库文件加载后会注册原始全局变量（如 window.spine、window.spine3_8），
// 加载完成后立即备份到 tl_ 前缀命名空间，后续代码仅使用 tl_ 命名空间
const SPINE_VERSIONS = {
  '3.5.35': { lib: () => self.tl_spine_3535, webglKey: 'webgl' },
  '3.6': { lib: () => self.tl_spine_36, webglKey: 'webgl' },
  '3.7': { lib: () => self.tl_spine_37, webglKey: 'webgl' },
  '3.8': { lib: () => self.tl_spine_38, webglKey: 'webgl' },
  '4.0': { lib: () => self.tl_spine_40, webglKey: null },
  '4.1': { lib: () => self.tl_spine_41, webglKey: null },
  '4.2': { lib: () => self.tl_spine_42, webglKey: null },
};

// 库文件注册的原始全局变量名 → 加载后需要备份到 tl_ 命名空间
const SPINE_ORIGINAL_NS = {
  '3.5.35': 'spine_3_5_35',
  '3.6': 'spine',       // spine_3_6.js 注册为 var spine; → window.spine
  '3.7': 'spine3_7',
  '3.8': 'spine3_8',
  '4.0': 'spine_4',     // spine_4_0_64.js 注册为 var spine_4
  '4.1': 'spine_4_1',
  '4.2': 'spine_4_2',
};

// 版本 → tl_ 命名空间名
const SPINE_TL_NS = {
  '3.5.35': 'tl_spine_3535',
  '3.6': 'tl_spine_36',
  '3.7': 'tl_spine_37',
  '3.8': 'tl_spine_38',
  '4.0': 'tl_spine_40',
  '4.1': 'tl_spine_41',
  '4.2': 'tl_spine_42',
};

function getDocumentZoom() {
  const gameZoom = globalThis.game?.documentZoom;
  if (Number.isFinite(gameZoom) && gameZoom > 0) return gameZoom;
  const windowZoom = globalThis.window?.documentZoom;
  if (Number.isFinite(windowZoom) && windowZoom > 0) return windowZoom;
  const bodyZoom = typeof window !== 'undefined' ? parseFloat(window.getComputedStyle(document.body).zoom) : NaN;
  if (Number.isFinite(bodyZoom) && bodyZoom > 0) return bodyZoom;
  return 1;
}

function getMaskStencilPriority(mask) {
  if (!mask || mask.type === 'rect') return 0;
  if (mask.type === 'roundRect') return 1;
  return 2;
}

function isAnimationDebugEnabled(...kinds) {
  const flag = globalThis.window?.decadeUIAnimationDebug ?? globalThis.window?.dcdAnimDebug;
  if (flag === true) return true;
  const list = Array.isArray(flag) ? flag : [flag];
  return kinds.flat().some(kind => kind && list.includes(kind));
}

function toPlainRect(rect) {
  if (!rect) return null;
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height, x: rect.x, y: rect.y };
}

function safeDebugString(payload) {
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return String(error?.message || error);
  }
}

function pushDebugHistory(type, payload) {
  const history = (globalThis.window.dcdAnimDebugHistory ||= []);
  history.push({ type, time: Date.now(), payload });
  if (history.length > 60) history.splice(0, history.length - 60);
}

/**
 * 将库文件注册的原始全局变量备份到 tl_ 前缀命名空间
 * 在库文件 onload 或检测到运行时已存在时调用
 */
function ensureTlNamespace(version) {
  const origName = SPINE_ORIGINAL_NS[version];
  const tlName = SPINE_TL_NS[version];
  if (!origName || !tlName) return;
  const orig = self[origName];
  if (orig && !self[tlName]) {
    self[tlName] = orig;
  }
}

// 版本字符串 → 标准化（与皮肤切换 normalizeSpineExportVersionString 一致）
function normalizeSpineVersion(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const v = raw.trim();
  if (v.indexOf('3.5') === 0) {
    if (v <= '3.5.35') return '3.5.35';
    return '3.6';
  }
  if (v.indexOf('3.6') === 0) return '3.6';
  if (v.indexOf('3.7') === 0) return '3.7';
  if (v.indexOf('3.8') === 0) return '3.8';
  if (v.indexOf('4.0') === 0) return '4.0';
  if (v.indexOf('4.1') === 0) return '4.1';
  if (v.indexOf('4.2') === 0) return '4.2';
  return null;
}

// 从 ArrayBuffer 检测 spine 版本（与皮肤切换 detectSpineVersionFromArrayBuffer 一致）
function detectSpineVersionFromArrayBuffer(arrayBuffer, skelType) {
  if (!arrayBuffer || !arrayBuffer.byteLength) return null;
  const sk = (skelType || 'skel').toLowerCase();
  if (sk === 'json') {
    let text;
    try {
      const slice = arrayBuffer.byteLength > 16384 ? arrayBuffer.slice(0, 16384) : arrayBuffer;
      text = typeof TextDecoder !== 'undefined'
        ? new TextDecoder('utf-8').decode(new Uint8Array(slice))
        : String.fromCharCode.apply(null, new Uint8Array(slice));
    } catch (e) { return null; }
    const spineField = text.match(/"spine"\s*:\s*"([^"]+)"/);
    if (spineField && spineField[1]) {
      const inner = spineField[1];
      let m = inner.match(/\d\.\d+\.\d+/);
      if (m) return normalizeSpineVersion(m[0]);
      m = inner.match(/\d\.\d+/);
      if (m) return normalizeSpineVersion(m[0] + '.0');
    }
    const vm = text.match(/\d\.\d+\.\d+/);
    if (vm) return normalizeSpineVersion(vm[0]);
    return null;
  }
  const n = Math.min(arrayBuffer.byteLength, 512);
  let dStr = '';
  const u8 = new Uint8Array(arrayBuffer, 0, n);
  for (let i = 0; i < n; i++) dStr += String.fromCharCode(u8[i]);
  const m = dStr.match(/\d\.\d+\.\d+/);
  if (m) return normalizeSpineVersion(m[0]);
  return null;
}

async function readMobileSpineFile(url) {
  if (!globalThis.window?.cordova || typeof game?.readFile !== 'function') return null;
  try {
    const fileUrl = new URL(url, globalThis.location?.href);
    console.log("[十周年UI调试] readMobileSpineFile: url=" + url, "resolved=" + fileUrl.href, "protocol=" + fileUrl.protocol);
    if (fileUrl.protocol !== 'file:') return null;
    const relPath = get.relativePath(fileUrl);
    console.log("[十周年UI调试] readMobileSpineFile: relPath=" + relPath);
    const buffer = await game.promises.readFile(relPath);
    console.log("[十周年UI调试] readMobileSpineFile: 读取成功, size=" + (buffer?.byteLength || buffer?.length || 0));
    if (buffer instanceof ArrayBuffer) return buffer;
    if (ArrayBuffer.isView(buffer)) {
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }
  } catch (e) { console.log("[十周年UI调试] readMobileSpineFile: 异常=" + e.message, "url=" + url); }
  return null;
}

function installMobileAssetReader(assetManager, version) {
  if (!globalThis.window?.cordova || version === '3.6' || !assetManager) return;
  const downloader = assetManager.downloader || assetManager;
  if (downloader._decadeMobileFileReader) return;

  const originalDownloadBinary = downloader.downloadBinary?.bind(downloader);
  const originalDownloadText = downloader.downloadText?.bind(downloader);

  if (originalDownloadBinary) {
    downloader.downloadBinary = (url, success, error) => {
      readMobileSpineFile(url).then(buffer => {
        if (buffer?.byteLength) success(new Uint8Array(buffer));
        else originalDownloadBinary(url, success, error);
      });
    };
  }

  if (originalDownloadText) {
    downloader.downloadText = (url, success, error) => {
      readMobileSpineFile(url).then(buffer => {
        if (buffer?.byteLength) success(new TextDecoder('utf-8').decode(new Uint8Array(buffer)));
        else originalDownloadText(url, success, error);
      });
    };
  }

  downloader._decadeMobileFileReader = true;
}

// 获取版本对应的 spine 全局库的 webgl 子空间
function getSpineWebgl(version) {
  const cfg = SPINE_VERSIONS[version];
  if (!cfg) return null;
  const lib = cfg.lib();
  if (!lib) return null;
  // 3.x 的全局变量在 tl_spine_36 等（独立命名空间），webgl 子空间在 tl_spine_36.webgl
  // 4.0+ 的全局变量在 tl_spine_40 等，Shader/Batcher/Renderer 在顶层
  return cfg.webglKey ? lib[cfg.webglKey] : lib;
}

// 获取版本对应的 spine 全局库（数据层：TextureAtlas, SkeletonBinary 等）
function getSpineLib(version) {
  const cfg = SPINE_VERSIONS[version];
  if (!cfg) return null;
  return cfg.lib();
}

// 渲染节点 - 管理单个 spine 实例的变换、动画、遮罩等
class SpineNode {
  constructor(skeleton, state, bounds, meta = {}) {
    this.skeleton = skeleton;
    this.state = state;
    this.bounds = bounds;
    this.meta = meta;
    this.visible = true;

    // 变换属性
    this.x = meta.x ?? 0.5;
    this.y = meta.y ?? 0.5;
    // 支持 scale 为数组 [scaleX, scaleY] 或单一数值
    if (Array.isArray(meta.scale)) {
      this.scaleX = meta.scale[0] ?? 1;
      this.scaleY = meta.scale[1] ?? 1;
      this.scale = Math.max(this.scaleX, this.scaleY);
    } else {
      this.scale = meta.scale ?? 1;
      this.scaleX = this.scale;
      this.scaleY = this.scale;
    }
    this.angle = meta.angle ?? meta.rotation ?? 0;
    this.opacity = 1;
    this.flipX = !!meta.mirror;
    this.flipY = false;
    this.speed = meta.speed ?? 1;

    // 渲染结果缓存
    this.renderX = 0;
    this.renderY = 0;
    this.renderScale = 1;
    this.renderAngle = 0;
    this.renderOpacity = 1;
    this.renderClip = null;
    this.renderMaskType = null;
    this.renderMaskConfig = null;
    this._stencilActive = false;

    // MVP 矩阵
    this.mvp = null; // 由 createSpineNode 设置

    // spine 运行时版本（记录用，不影响路由）
    this.version = meta.version || null;

    // 动画控制
    this.loop = meta.loop ?? true;
    this.loopCount = meta.loopCount || 0;
    this.completed = false;
    this.action = meta.action || null;
    this.animationEnd = meta.animationEnd || null;

    // 遮罩/插槽
    this.hideSlots = meta.hideSlots || null;
    this.clipSlots = meta.clipSlots || null;
    this.disableMask = meta.disableMask || false;
    this.clip = meta.clip || null;

    // 预乘 alpha（AnimationPlayer 兼容）
    this.premultipliedAlpha = !!meta.alpha;

    // DOM 对齐参考
    this.referNode = meta.referNode || null;
    this.referFollow = meta.referFollow || false;
    this.referBounds = undefined;

    // 回调
    this.onupdate = meta.onupdate || null;
    this.oncomplete = meta.oncomplete || null;

    // 容器归属
    this.container = null;
    this.isSpine = true;
    this._destroyed = false;

    // 节点级层遮罩（如 bgImg/spineBg 的 bgMask，独立于容器 mask）
    this.layerMask = null;
  }

  get destroyed() {
    return this._destroyed;
  }

  // 设置动画
  setAction(actionName, mixDuration = 0) {
    if (!this.skeleton) return;
    this.action = actionName;
    this.state.setAnimation(0, actionName, this.loop).mixDuration = mixDuration;
  }

  // 添加动画队列
  addAnimation(trackIndex, actionName, loop, delay = 0) {
    if (!this.skeleton) return;
    this.state.addAnimation(trackIndex, actionName, loop, delay);
  }

  // 重置为默认动作
  resetAction(mixDuration = 0.5) {
    if (!this.skeleton || !this.skeleton.data) return;
    const defaultAnim = this.skeleton.data.animations[0]?.name;
    if (defaultAnim) {
      this.state.setAnimation(0, defaultAnim, this.loop).mixDuration = mixDuration;
    }
  }

  // 设置播放速度
  setSpeed(speed) {
    this.speed = speed;
  }

  // 设置透明度
  setOpacity(opacity) {
    this.opacity = opacity;
  }

  // 渐变透明度（简易版，由外部 gsap 驱动）
  fadeTo(targetOpacity) {
    this.opacity = targetOpacity;
  }

  // 销毁
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    if (this.state) {
      this.state.clearListeners();
      this.state.clearTracks();
    }
    // 通过容器的反向引用释放 spine 资源引用计数
    if (this._assetFilename && this.container?._renderer) {
      this.container._renderer._releaseSpineAsset(this._assetFilename);
      this._assetFilename = null;
    }
    this.skeleton = null;
    this.state = null;
    this.container = null;
    this.onupdate = null;
    this.oncomplete = null;
    this.referNode = null;
  }
}

// 图片节点 - 在 WebGL 层渲染静态 PNG 图片，复用遮罩系统
class ImageNode {
  constructor(imageOrUrl, meta = {}) {
    this.src = imageOrUrl;
    this._image = null;
    this._texture = null;
    this._textureReady = false;

    // 变换属性（兼容 SpineNode 接口）
    this.x = meta.x ?? 0.5;
    this.y = meta.y ?? 0.5;
    this.scale = meta.scale ?? 1;
    this.angle = meta.angle ?? 0;
    this.visible = true;
    this.opacity = meta.opacity ?? 1;
    this.flipX = !!meta.mirror;
    this.flipY = false;

    // 渲染结果缓存
    this.renderX = 0;
    this.renderY = 0;
    this.renderScale = 1;
    this.renderAngle = 0;
    this.renderOpacity = 1;
    this.renderClip = null;
    this.renderMaskType = null;
    this.renderMaskConfig = null;
    this._clippedOut = false;
    this._stencilActive = false;

    // 容器归属
    this.container = null;
    this.isSpine = false;
    this._destroyed = false;
    this.completed = false;  // ImageNode 始终渲染，不设为 true

    // 遮罩
    this.layerMask = null;

    // 图片尺寸
    this._naturalWidth = 1;
    this._naturalHeight = 1;

    // 布局参数（由 resizeSpineNodes 设置）
    this._origMeta = undefined;
    this._containerRect = undefined;
    this._baseScale = undefined;

    this.meta = meta || {};
    this.bounds = null;
  }

  get destroyed() { return this._destroyed; }

  async load() {
    if (this._image && this._image.complete && this._image.naturalWidth) {
      this._naturalWidth = this._image.naturalWidth;
      this._naturalHeight = this._image.naturalHeight;
      return;  // 不设 completed=true，ImageNode 始终渲染
    }
    let img;
    if (typeof this.src === 'string') {
      img = new Image();
      // 不设置 crossOrigin，避免把同源请求变成 CORS 请求导致 texImage2D 失败
      img.src = this.src;
    } else if (this.src instanceof HTMLImageElement) {
      img = this.src;
    } else {
      console.warn('[ImageNode] 无效的图片源:', typeof this.src);
      return;
    }
    if (!img.complete) {
      await new Promise((resolve) => {
        const onLoad = () => resolve();
        const onError = () => { console.warn('[ImageNode] 图片加载失败:', this.src); resolve(); };
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });
      });
    }
    this._image = img;
    this._naturalWidth = img.naturalWidth || img.width || 1;
    this._naturalHeight = img.naturalHeight || img.height || 1;
    // 不设 completed=true，ImageNode 需要持续渲染
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    // 释放 ImageNode 的 GPU 纹理
    if (this._image && this.container?._renderer) {
      const renderer = this.container._renderer;
      const tex = renderer._imageTextures.get(this._image);
      if (tex && renderer.gl && !renderer.gl.isContextLost()) {
        try { renderer.gl.deleteTexture(tex); } catch (e) {}
      }
      renderer._imageTextures.delete(this._image);
    }
    this._image = null;
    this._texture = null;
    this._textureReady = false;
    this.container = null;
    this.completed = true;
  }
}

// Spine容器 - 类似 PIXI.Container，管理一组 SpineNode
class SpineContainer {
  constructor(options = {}) {
    this.id = SpineContainer._idCounter++;
    this.name = options.name || '';
    this.zIndex = options.zIndex ?? 0;

    // 子节点
    this.children = [];
    this.spineNodes = [];

    // 容器变换（统一缩放/移动所有子节点）
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.scaleX = options.scaleX ?? 1;
    this.scaleY = options.scaleY ?? 1;
    this.alpha = options.alpha ?? 1;

    // 缩放锚点（类似 PIXI 的 pivot），0~1 表示归一化比例
    // 锚点原理：缩放后平移 offset = pivot * (1 - scale) * size
    this.pivotX = options.pivotX ?? 0; // 0=左/上, 0.5=居中, 1=右/下
    this.pivotY = options.pivotY ?? 0;

    // 可见性 - 设为 false 时所有子节点停止渲染和动画
    this.visible = true;

    // 遮罩（SVG Path 格式）
    this.mask = options.mask || null; // { type: 'svg'|'rect'|'roundRect'|'lutou', ... }
    this._maskPath2D = null; // 缓存 Canvas2D Path2D

    // DOM 对齐
    this.fatherDOM = options.fatherDOM || null;
    this._layoutRect = options.layoutRect || null;

    // 层级容器（保持与旧版兼容：bgImg / spineBg / spineQg / spinePe）
    this.bgImg = [];
    this.spineBg = [];
    this.spineQg = [];
    this.spinePe = [];

    // 容器类型标记
    this._spineType = options.type || null;
    this._spineResizeHandler = null;
    this._spineResizeLogic = null;
    this._spineInstanceList = [];
    this._spineIsCharacter = false;

    // 布局更新函数
    this._updateBoxLayout = null;
    this._forceUpdateBoxLayout = null;

    // WebGL 遮罩相关
    this.spineMask = null;
    this.bgMask = null;

    // 父容器引用（用于检查可见性链）
    this.parentContainer = null;

    // 容器内容区域的参考尺寸（用于计算锚点偏移）
    this._contentWidth = options.contentWidth ?? 0;
    this._contentHeight = options.contentHeight ?? 0;
  }

  static _idCounter = 0;

  addChild(node) {
    if (node instanceof SpineNode || node instanceof ImageNode) {
      node.container = this;
      this.spineNodes.push(node);
    } else if (node instanceof SpineContainer) {
      node.parentContainer = this;
    }
    this.children.push(node);
    return this;
  }

  removeChild(node) {
    const idx = this.children.indexOf(node);
    if (idx !== -1) this.children.splice(idx, 1);
    const sIdx = this.spineNodes.indexOf(node);
    if (sIdx !== -1) this.spineNodes.splice(sIdx, 1);
    return this;
  }

  // 设置遮罩（SVG path 格式）
  setMask(maskConfig) {
    this.mask = maskConfig;
    this._maskPath2D = null; // 清除缓存
  }

  // 构建Canvas2D Path2D（用于 WebGL scissor 裁剪参数计算）
  _buildMaskPath2D(width, height) {
    if (!this.mask) return null;
    if (this._maskPath2D && this._maskWidth === width && this._maskHeight === height) {
      return this._maskPath2D;
    }

    const path = new Path2D();
    const m = this.mask;

    if (m.type === 'rect') {
      path.rect(m.x ?? 0, m.y ?? 0, m.width ?? width, m.height ?? height);
    } else if (m.type === 'roundRect') {
      const r = m.radius ?? Math.min(width, height) * 0.05;
      path.roundRect(m.x ?? 0, m.y ?? 0, m.width ?? width, m.height ?? height, r);
    } else if (m.type === 'svg') {
      // SVG path data，直接使用
      const pathData = m.path.replace(/(\d)([a-zA-Z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2');
      const svgPath = new Path2D(pathData);
      // SVG path 是归一化的 (0-1)，需要缩放到实际尺寸
      const transform = new DOMMatrix();
      transform.translateSelf(m.x ?? 0, m.y ?? 0);
      transform.scaleSelf(width, height);
      path.addPath(svgPath, transform);
    } else if (m.type === 'lutou') {
      // 露头形状遮罩（与原版 drawMask 兼容）
      const lutouPath = new Path2D();
      this._drawLutouPath(lutouPath, m.width ?? width, m.height ?? height, m.isBg, m.style);
      const transform = new DOMMatrix();
      transform.translateSelf(m.x ?? 0, m.y ?? 0);
      path.addPath(lutouPath, transform);
    }

    this._maskPath2D = path;
    this._maskWidth = width;
    this._maskHeight = height;
    return path;
  }

  _drawLutouPath(path, w, h, isBg = false, style = 'on') {
    SpineMask._drawLutouPath(path, w, h, isBg, style);
  }

  // 显示/隐藏容器
  setVisible(visible) {
    this.visible = visible;
    if (!visible) {
      // 隐藏时暂停所有动画
      for (const node of this.spineNodes) {
        if (node.state) {
          node.speed = 0;
        }
      }
    } else {
      // 显示时恢复动画速度
      for (const node of this.spineNodes) {
        if (node.state && node.meta) {
          node.speed = node.meta.speed ?? 1;
        }
      }
    }
    // 【问题二修复】可见性变更时同步更新变换
    this.updateTransform();
  }

  // 缩放容器内所有 spine
  setScale(scaleX, scaleY) {
    this.scaleX = scaleX;
    this.scaleY = scaleY ?? scaleX;
    // 【问题二修复】缩放变更时同步更新变换
    this.updateTransform();
  }

  // 移动容器
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    // 【问题二修复】位置变更时同步更新变换
    this.updateTransform();
  }

  // 【问题三】设置缩放锚点（类似 PIXI 的 pivot）
  // pivotX/pivotY: 0~1 归一化比例，0.5=居中
  setPivot(pivotX, pivotY) {
    this.pivotX = pivotX ?? 0;
    this.pivotY = pivotY ?? 0;
    this.updateTransform();
  }

  // 设置容器内容区域参考尺寸（用于锚点偏移计算）
  setContentSize(width, height) {
    this._contentWidth = width;
    this._contentHeight = height;
  }

  // 【问题二关键】更新容器变换，应用到所有子节点
  // 容器只存了变换数据，没有把变换应用到真正的 spine 骨骼上
  // 加此方法后：容器 scale → 所有 spine 一起缩放，x/y → 一起移动，alpha → 一起透明
  // 注：当前渲染器在 _updateNodeRenderParams 中通过遍历容器链自动叠加 x/y/scaleX/alpha，
  //     所以 updateTransform 主要用于锚点偏移的实时计算，以及将来可能的直接骨骼操控
  updateTransform() {
    if (!this.visible) return;

    // PIXI 兼容锚点偏移计算
    // PIXI 公式: worldX = position.x + (localX - pivot.x) * scale
    // 等价展开: worldX = position.x - pivot.x * scale + localX * scale
    // 其中 anchorOffsetX = -pivot.x * scale，即 -pivotNorm * scale * contentSize
    // 注意：此公式要求 container.x 等于 PIXI 的 position.x（pivot 点世界坐标），
    //       子容器 localX 也需包含 pivot 偏移（= PIXI localX - pivot.x 的符号取反后补偿）
    const anchorOffsetX = -this.pivotX * this.scaleX * (this._contentWidth || 0);
    const anchorOffsetY = -this.pivotY * this.scaleY * (this._contentHeight || 0);

    // 将锚点偏移量叠加到容器的变换中
    // （通过 _anchorOffsetX/Y 临时属性，供 _updateNodeRenderParams 读取）
    this._anchorOffsetX = anchorOffsetX;
    this._anchorOffsetY = anchorOffsetY;

    // 递归更新子容器
    for (const child of this.children) {
      if (child instanceof SpineContainer) {
        child.updateTransform();
      }
    }
  }

  // 【问题四】迁移所有 children 到目标容器
  // 用于页面切换时复用已有 spine 实例，避免重新创建
  // 会遍历 bgImg / spineBg / spineQg / spinePe 各层级，将实例从旧容器移到新容器
  migrateChildrenTo(targetContainer) {
    if (!targetContainer) {
      return this;
    }

    // 迁移各层级的 spine 实例和图片节点
    const layers = ['bgImg', 'spineBg', 'spineQg', 'spinePe'];
    let migratedCount = 0;

    for (const layer of layers) {
      const sourceLayer = this[layer];
      const targetLayer = targetContainer[layer];

      if (!Array.isArray(sourceLayer) || !Array.isArray(targetLayer)) continue;

      for (const node of [...sourceLayer]) { // 用副本遍历，原数组会被修改
        // 从旧容器移除
        const idx = sourceLayer.indexOf(node);
        if (idx !== -1) sourceLayer.splice(idx, 1);
        this.removeChild(node);

        // 加入新容器
        targetLayer.push(node);
        targetContainer.addChild(node);

        // 更新节点的 container 引用
        if (node instanceof SpineNode) {
          node.container = targetContainer;
        }

        migratedCount++;
      }
    }

    // 迁移 children 列表中剩余的非层级节点
    for (const child of [...this.children]) {
      if (!layers.some(l => this[l]?.includes(child))) {
        this.removeChild(child);
        targetContainer.addChild(child);
        migratedCount++;
      }
    }

    // 迁移 spineNodes 列表
    for (const node of [...this.spineNodes]) {
      const sIdx = this.spineNodes.indexOf(node);
      if (sIdx !== -1) {
        this.spineNodes.splice(sIdx, 1);
        node.container = targetContainer;
        targetContainer.spineNodes.push(node);
      }
    }
    return this;
  }

  // 销毁容器及所有子节点
  destroy() {
    for (const node of this.spineNodes) {
      node.destroy();
    }
    this.spineNodes = [];
    this.children = [];
    this.bgImg = [];
    this.spineBg = [];
    this.spineQg = [];
    this.spinePe = [];
    this.fatherDOM = null;
    this._updateBoxLayout = null;
    this._forceUpdateBoxLayout = null;
    if (this._spineResizeHandler) {
      window.removeEventListener("resize", this._spineResizeHandler);
      this._spineResizeHandler = null;
    }
  }
}

// 主渲染器类 - 使用 AnimationPlayer 的资源加载和渲染逻辑
class SpineRenderer {
  constructor(canvasOrContainer, options = {}) {
    this.options = options;
    this.dpr = Math.max(window.devicePixelRatio * getDocumentZoom(), 1);
    this.dprAdaptive = options.dprAdaptive !== false;
    this.frameTime = undefined;
    this.running = false;
    this.resized = false;
    this.requestId = undefined;

    // 容器管理
    this.containers = [];
    this.allNodes = [];

    // 资源管理 - 按版本存储渲染组件
    this.spineComponents = {}; // version → { shader, batcher, skeletonRenderer, assetManager, assets, skeletons }
    this._pendingComponents = {}; // version → Promise (防止并发创建的竞态)
    this.gl = null;
    this.loadedAssets = {}; // basePath → { skelType, name, version }
    this._versionCache = {}; // filename|skelType → version string
    this._maskDebugEnabled = false; // 遮罩调试日志（排查完问题后设为false）

    // 资源引用计数 & LRU 管理（防止 GPU 纹理内存泄漏）
    this._assetRefCount = {};   // filename → 当前活跃 SpineNode 数量
    this._assetLoadOrder = [];  // 按加载顺序记录的 filename 列表（用于 LRU 驱逐）
    this._maxLoadedAssets = 40; // 最大同时加载的 spine 资源数（超限时驱逐最久未用的）
    this._pendingAssets = new Set();     // 已加载但尚未被 createSpineNode 消费的资源（防止并发加载时被 LRU 驱逐）
    this._pendingAssetsTime = new Map(); // pending → 加入时间戳（用于清理过期条目）

    // ImageNode WebGL 渲染资源
    this._imageProgram = null;
    this._imageQuadBuffer = null;
    this._imageTextures = new Map(); // Image对象 → WebGL texture

    // 创建画布
    if (canvasOrContainer instanceof HTMLCanvasElement) {
      this.canvas = canvasOrContainer;
    } else {
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;will-change:transform;';
      if (canvasOrContainer instanceof HTMLElement) {
        canvasOrContainer.appendChild(this.canvas);
      }
    }
    this.canvas.className = (this.canvas.className || '') + ' spine-renderer';
    // 记录原始父容器（用于 clearCanvasClip 恢复）
    this._canvasOriginalParent = this.canvas.parentElement;

    // 初始化 WebGL（使用 tl_ 前缀独立命名空间的运行时）
    this._initWebGL();
    this.updateCanvasSize(true);

    // 绑定 resize
    this._resizeHandler = () => { this.resized = false; };
    window.addEventListener('resize', this._resizeHandler);

    // WebGL 上下文丢失/恢复事件
    // 关键设计：上下文丢失时不清空 spineComponents，保留 ManagedWebGLRenderingContext 的 restorables 引用
    // 上下文恢复时利用 spine 运行时内置的 restore() 机制重建所有 GL 资源
    // （与 PIXI+pixi-spine 的自动恢复机制类似）
    this._contextLost = false;
    this._contextLostHandler = (e) => {
      e.preventDefault();
      this._contextLost = true;
      this.running = false;
      this.requestId = undefined;
      console.warn('[SpineRenderer] WebGL 上下文丢失，等待恢复...');
    };
    this._contextRestoredHandler = () => {
      console.warn('[SpineRenderer] WebGL 上下文已恢复，开始重建 GL 资源...');
      this._contextLost = false;
      // 1. 利用 spine 运行时内置的 restore() 机制重建所有 GL 资源
      //    （shader 重新编译、mesh 重建 buffer、GLTexture 从缓存图片重新上传）
      this._restoreSpineGLResources();
      // 2. 重建自定义 GL 资源（图片渲染的 shader/buffer）
      this._imageTextures.clear();
      this._imageProgram = null;
      this._imageLoc = null;
      this._imageQuadBuffer = null;
      // 3. 强制下一帧重新设置 canvas 尺寸
      this.resized = false;
      // 4. 重新启动渲染循环
      this.start();
      console.warn('[SpineRenderer] GL 资源重建完成，渲染循环已重启');
    };
    this.canvas.addEventListener('webglcontextlost', this._contextLostHandler);
    this.canvas.addEventListener('webglcontextrestored', this._contextRestoredHandler);
  }

  updateCanvasSize(force = false) {
    const canvas = this.canvas;
    if (!canvas) return false;
    const dpr = this.dprAdaptive
      ? Math.max(window.devicePixelRatio * getDocumentZoom(), 1)
      : (this.dpr || 1);
    this.dpr = dpr;
    const rect = canvas.getBoundingClientRect?.();
    const fallbackWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 300;
    const fallbackHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 150;
    const cssWidth = canvas.clientWidth || rect?.width || fallbackWidth;
    const cssHeight = canvas.clientHeight || rect?.height || fallbackHeight;
    const width = Math.max(1, Math.round(cssWidth * dpr));
    const height = Math.max(1, Math.round(cssHeight * dpr));
    if (!force && this.resized && canvas.width === width && canvas.height === height) return false;
    canvas.width = width;
    canvas.height = height;
    this.resized = true;
    return true;
  }

  /**
   * 确保指定版本的 spine 运行时可用
   * 不等待，直接检测；不可用则立即主动加载
   */
  async _waitForSpineRuntime(version) {
    // 确保原始全局变量已备份到 tl_ 命名空间（防止其他扩展覆写后丢失引用）
    ensureTlNamespace(version);
    if (getSpineWebgl(version)) {
      // 运行时已就绪，但可能还没打补丁，确保应用
      this._applyMatrix4Patches(version);
      return true;
    }
    return this._loadSpineRuntime(version);
  }

  /**
   * 对运行时应用补丁：
   * 1. 3.x filterFromString 修补（未知 filter 值如 "2048" 降级为 Nearest）
   * 2. Matrix4 补丁（从 3.6 的 spine.webgl.Matrix4 借用 scale/rotate/concat/setPos2D）
   */
  _applyMatrix4Patches(version) {
    const lib = getSpineLib(version);
    const webgl = getSpineWebgl(version);

    // 3.x: 修补 filterFromString，对未知 filter 值（如 "2048"）返回 Nearest 而非抛异常
    if (lib && lib.Texture && lib.Texture.filterFromString && !lib.Texture._filterPatched) {
      const origFilter = lib.Texture.filterFromString;
      const fallbackFilter = lib.TextureFilter ? lib.TextureFilter.Nearest : 9728;
      lib.Texture.filterFromString = function (text) {
        try { return origFilter.call(this, text); }
        catch (e) {
          console.warn(`[SpineRenderer] filterFromString: 未知 filter "${text}" → 使用 Nearest`);
          return fallbackFilter;
        }
      };
      lib.Texture._filterPatched = true;
    }

    // 3.x: 修补 TextureAtlas.load，处理非标准 header 行（如 pma:true）
    // Spine 3.8 解析器不认识 pma:true，会导致后续行全部错位
    if (lib && lib.TextureAtlas && lib.TextureAtlas.prototype.load && !lib.TextureAtlas._loadPatched) {
      const origLoad = lib.TextureAtlas.prototype.load;
      lib.TextureAtlas.prototype.load = function (atlasText, textureLoader) {
        // 预处理：移除 pma:true 等非标准 header 行
        if (typeof atlasText === 'string') {
          atlasText = atlasText.replace(/^pma\s*:\s*true\s*$/gm, '');
        }
        return origLoad.call(this, atlasText, textureLoader);
      };
      lib.TextureAtlas._loadPatched = true;
    }

    // 3.x: 修补 BinaryInput.readString，使用 TextDecoder 正确解码 UTF-8 多字节字符
    // 原版手动 UTF-8 解码在某些字符上会产生乱码，导致 atlas region 查找失败
    if (lib && lib.BinaryInput && lib.BinaryInput.prototype.readString && !lib.BinaryInput._readStringPatched) {
      lib.BinaryInput.prototype.readString = function () {
        var byteCount = this.readInt(true);
        switch (byteCount) {
          case 0: return null;
          case 1: return "";
        }
        byteCount--;
        var bytes = new Uint8Array(this.buffer.buffer, this.index, byteCount);
        this.index += byteCount;
        return new TextDecoder('utf-8').decode(bytes);
      };
      lib.BinaryInput._readStringPatched = true;
    }

    // Matrix4 补丁：从 3.6 的 spine.webgl.Matrix4 借用 scale/rotate/concat/setPos2D
    // 注意：node.mvp = new webgl.Matrix4()，补丁必须打到 webgl.Matrix4 上
    const baseWebgl = getSpineWebgl('3.6');
    if (!webgl || !webgl.Matrix4 || !baseWebgl || !baseWebgl.Matrix4) return;
    if (webgl.Matrix4.prototype._patched) return;

    const src = baseWebgl.Matrix4.prototype;
    const dst = webgl.Matrix4.prototype;
    if (!dst.scale) dst.scale = src.scale;
    if (!dst.rotate) dst.rotate = src.rotate;
    if (!dst.concat) dst.concat = src.concat;
    if (!dst.setPos2D) dst.setPos2D = src.setPos2D;
    // translate: 保存原始作为 originTranslate，替换为 3.6 版本
    if (dst.translate && !dst.originTranslate) {
      dst.originTranslate = dst.translate;
    }
    dst.translate = src.translate;

    dst._patched = true;
  }

  /**
   * WebGL 上下文恢复后，利用 spine 运行时内置的 restore() 机制重建所有 GL 资源
   * 
   * spine 运行时的 ManagedWebGLRenderingContext 有两个分支：
   *   分支1（传入 canvas）：自动注册 webglcontextrestored 处理器
   *   分支2（传入 GL context）：不注册任何处理器
   * 我们传入的是原始 GL context（分支2），所以需要手动触发恢复。
   * 
   * restore() 机制：
   *   - Shader.restore() → 重新编译 shader program
   *   - Mesh.restore() → 重建 vertex/index buffer
   *   - GLTexture.restore() → 从缓存的 _image 重新上传纹理到 GPU
   */

  /**
   * WebGL 上下文永久丢失后重建所有 spine 组件
   * 清空 spineComponents，触发所有活跃容器中的 spine 重新加载
   */
  _rebuildSpineComponents() {
    if (!this.gl) return;
    // 记录哪些版本曾经被使用过
    const usedVersions = new Set(Object.keys(this.spineComponents));
    // 清空所有版本组件（shader/batcher/renderer/assetManager 中的 GL 资源全部失效）
    for (const [version, components] of Object.entries(this.spineComponents)) {
      try {
        const am = components.assetManager;
        if (am?.assets) {
          for (const asset of Object.values(am.assets)) {
            if (asset && typeof asset.dispose === 'function') {
              try { asset.dispose(); } catch (e) {}
            }
          }
          am.assets = {};
        }
      } catch (e) {}
    }
    this.spineComponents = {};
    this._pendingComponents = {};
    this.loadedAssets = {};
    this._versionCache = {};
    this._assetRefCount = {};
    this._assetLoadOrder = [];
    this._pendingAssets.clear();
    this._pendingAssetsTime.clear();

    if (window.__tlMarkWebGLContext) {
      window.__tlMarkWebGLContext(this.canvas, this.gl);
    }

    console.warn(`[SpineRenderer] _rebuildSpineComponents: 已清理 ${usedVersions.size} 个版本组件，等待重新加载`);
  }

  _restoreSpineGLResources() {
    if (!this.gl) {
      console.error('[SpineRenderer] _restoreSpineGLResources: gl 为空，无法恢复');
      return;
    }

    const restoredSet = new Set(); // 避免重复恢复同一个 ManagedWebGLRenderingContext

    for (const [version, components] of Object.entries(this.spineComponents)) {
      if (!components) continue;

      try {
        // 收集此版本所有 ManagedWebGLRenderingContext 实例
        // 每个 spine 组件（Shader/PolygonBatcher/AssetManager）在创建时
        // 都会各自创建一个 ManagedWebGLRenderingContext 包装同一个 GL context
        const contexts = [];

        // Shader.context → restorables 包含 Shader 自身
        if (components.shader?.context) {
          contexts.push(components.shader.context);
        }

        // PolygonBatcher 有自己的 context，内部 Mesh 也有自己的 context
        if (components.batcher?.context) {
          contexts.push(components.batcher.context);
        }
        if (components.batcher?.mesh?.context) {
          contexts.push(components.batcher.mesh.context);
        }

        // AssetManager 的每个 GLTexture 也有自己的 context
        // 遍历 assetManager.assets 找到所有 GLTexture
        if (components.assetManager?.assets) {
          for (const [path, asset] of Object.entries(components.assetManager.assets)) {
            if (asset && typeof asset.restore === 'function' && asset.context) {
              contexts.push(asset.context);
            }
          }
        }

        // 对每个 ManagedWebGLRenderingContext，调用其所有 restorables 的 restore()
        for (const ctx of contexts) {
          if (restoredSet.has(ctx)) continue;
          restoredSet.add(ctx);

          // 确保 gl 引用指向恢复后的 context（同一个对象，但以防万一）
          if (this.gl && ctx.gl !== this.gl) {
            ctx.gl = this.gl;
          }

          if (ctx.restorables && ctx.restorables.length > 0) {
            for (const restorable of ctx.restorables) {
              try {
                restorable.restore();
              } catch (e) {
                console.warn(`[SpineRenderer] 恢复 GL 资源异常 (${version}):`, e?.message || e);
              }
            }
          }
        }

        console.log(`[SpineRenderer] 版本 ${version} GL 资源恢复完成 (contexts=${contexts.length}, restored=${restoredSet.size})`);
      } catch (e) {
        console.error(`[SpineRenderer] 版本 ${version} GL 资源恢复失败:`, e?.message || e);
      }
    }
  }

  /**
   * 主动加载指定版本的 spine 运行时
   * 加载后自动应用 Matrix4 补丁
   */
  _loadSpineRuntime(version) {
    const basePath = window.decadeUIPath || `${window.lib?.assetURL || '/'}extension/十周年UI/`;
    const scriptUrls = {
      '3.6': `${basePath}src/libs/spine.js`,
      '4.0': `${basePath}src/libs/spine_4_0_64.js`,
      '3.8': `${basePath}src/libs/spine_3_8.js`,
      '4.1': `${basePath}src/libs/spine_4_1.js`,
      '3.7': `${basePath}src/libs/spine_3_7.js`,
    };

    const url = scriptUrls[version];
    if (!url) {
      console.error(`[SpineRenderer] 版本 ${version} 无可用加载地址`);
      return Promise.resolve(false);
    }
    console.log("[十周年UI调试] _loadSpineRuntime: version=" + version, "url=" + url);

    // 所有非 3.6 版本都需要先确保 3.6 已加载（用于 Matrix4 补丁：scale/rotate/concat 等）
    const needsBase36 = version !== '3.6';
    const basePromise = needsBase36 && !getSpineWebgl('3.6')
      ? this._loadSpineRuntime('3.6')
      : Promise.resolve(true);

    return basePromise.then((baseOk) => {
      if (!baseOk) {
        console.warn(`[SpineRenderer] 3.6 基础运行时加载失败，${version} 可能缺少 Matrix4 方法`);
      }
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
          // 库文件加载完成，将原始全局变量备份到 tl_ 命名空间
          ensureTlNamespace(version);
          const webgl = getSpineWebgl(version);
          if (webgl && webgl.Shader && webgl.PolygonBatcher) {
            // 应用 Matrix4 补丁
            this._applyMatrix4Patches(version);
            resolve(true);
          } else {
            console.error(`[SpineRenderer] 版本 ${version} 加载后 webgl 不可用`);
            resolve(false);
          }
        };
        script.onerror = () => {
          console.error(`[SpineRenderer] 版本 ${version} 加载失败: ${url}`);
          resolve(false);
        };
        document.head.appendChild(script);
      });
    });
  }

  /**
   * 获取或创建指定版本的 spine 渲染组件
   * 使用皮肤切换的全局 spine 库（spine/spine_4/spine_4_1/spine_4_2 等）
   */
  async _getOrCreateComponents(version) {
    if (this.spineComponents[version]) return this.spineComponents[version];

    // 防止并发竞态：多个 cell 同时加载同版本时，只创建一次 assetManager
    if (this._pendingComponents[version]) return this._pendingComponents[version];

    if (!this.gl) {
      console.error('[SpineRenderer] WebGL 未初始化');
      return null;
    }

    const promise = (async () => {
      try {
        // 等待运行时就绪（皮肤切换异步加载，可能尚未完成）
        const ready = await this._waitForSpineRuntime(version);
        if (!ready) {
          console.error(`[SpineRenderer] 版本 ${version} 的 spine 运行时不可用`);
          return null;
        }

        // WebGL 上下文丢失保护：创建组件前再检查一次
        if (!this.gl || this.gl.isContextLost()) {
          console.error(`[SpineRenderer] 创建组件时 WebGL 上下文不可用`);
          return null;
        }

        const webgl = getSpineWebgl(version);
        const components = {
          shader: webgl.Shader.newTwoColoredTextured(this.gl),
          batcher: new webgl.PolygonBatcher(this.gl),
          skeletonRenderer: new webgl.SkeletonRenderer(this.gl),
          assetManager: new webgl.AssetManager(this.gl),
          assets: {},
          skeletons: [],
        };
        installMobileAssetReader(components.assetManager, version);

        this.spineComponents[version] = components;
        return components;
      } finally {
        delete this._pendingComponents[version];
      }
    })();

    this._pendingComponents[version] = promise;
    return promise;
  }

  /**
   * 检测骨骼文件版本
   */
  async _detectVersion(filename, skelType) {
    const key = filename + '|' + skelType;
    if (this._versionCache[key]) return this._versionCache[key];

    const fetchVersionBuffer = async (url) => {
      // 优先使用无名杀的 game.readFile（同时适用手机端和电脑端）
      if (typeof game?.promises?.checkFile === 'function' && typeof game?.promises?.readFile === 'function') {
        try {
          const exists = await game.promises.checkFile(url);
          if (exists === 1) {
            const buffer = await game.promises.readFile(url);
            if (buffer instanceof ArrayBuffer && buffer.byteLength) return buffer;
            if (ArrayBuffer.isView(buffer) && buffer.byteLength) {
              return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            }
            if (typeof buffer === 'string' && buffer.length > 0) {
              return new TextEncoder().encode(buffer).buffer;
            }
          }
        } catch (e) {
          console.warn(`[SpineRenderer] _detectVersion: game.readFile失败 (${url})`, e?.message || e);
        }
      }

      // 回退到 XMLHttpRequest
      const xhrFetch = (xhrUrl) => new Promise((resolve) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', xhrUrl, true);
          xhr.responseType = 'arraybuffer';
          xhr.timeout = 10000;
          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 206 || xhr.status === 0) {
              const buf = xhr.response;
              if (buf && buf.byteLength) resolve(buf);
              else resolve(null);
            } else {
              resolve(null);
            }
          };
          xhr.onerror = () => resolve(null);
          xhr.ontimeout = () => resolve(null);
          xhr.send();
        } catch (e) {
          resolve(null);
        }
      });

      let buf = await xhrFetch(url);
      if (buf?.byteLength) return buf;

      console.warn(`[SpineRenderer] _detectVersion: 所有读取方式均失败 (${url})`);
      return null;
    };

    // 尝试 skel 和 json 两种扩展名检测版本
    const tryExts = skelType === 'json' ? ['.json'] : ['.skel', '.json'];
    for (const ext of tryExts) {
      const url = filename + ext;
      const buf = await fetchVersionBuffer(url);
      // console.log("[十周年UI调试] _detectVersion:", url, "buf=" + (buf ? buf.byteLength + "bytes" : "null"));
      if (!buf) continue;

      const detectType = ext === '.json' ? 'json' : 'skel';
      const version = detectSpineVersionFromArrayBuffer(buf, detectType) || '3.6';
      // console.log("[十周年UI调试] _detectVersion: 检测到版本=" + version, url);
      if (skelType !== 'json' && ext === '.json') {
        this._versionCache[key + ':actualType'] = 'json';
      }
      this._versionCache[key] = version;
      return version;
    }

    console.warn(`[SpineRenderer] _detectVersion: 两种扩展名均失败，默认3.6 (${filename})`);
    this._versionCache[key] = '3.6';
    return '3.6';
  }

  /**
   * 获取文件实际类型（skel 或 json）
   * 版本检测时会自动判断：如果 .skel 404 但 .json 存在，actualType 为 'json'
   */
  _getActualSkelType(filename, skelType) {
    const key = filename + '|' + skelType + ':actualType';
    return this._versionCache[key] || skelType;
  }

  _initWebGL() {
    const opts = { alpha: true, premultipliedAlpha: false, stencil: true };
    this.gl = this.canvas.getContext('webgl2', opts) || this.canvas.getContext('webgl', opts) || this.canvas.getContext('experimental-webgl', opts);
    if (!this.gl) {
      // 诊断：检查当前页面有多少 WebGL 上下文
      const canvases = document.querySelectorAll('canvas');
      let webglCount = 0;
      canvases.forEach(c => {
        try {
          const ctx = c.getContext('webgl2') || c.getContext('webgl');
          if (ctx) webglCount++;
        } catch (e) {}
      });
      console.error(`[SpineRenderer] WebGL 不可用（当前页面约 ${webglCount} 个 canvas，WebGL 上下文数量可能已达浏览器上限）`);
      return;
    }
    if (this.gl instanceof WebGL2RenderingContext) {
      this.gl.isWebgl2 = true;
    }
    // 标记为雷霆拥有的上下文（防止被 WebGLGuard 主动释放）
    if (window.__tlMarkWebGLContext) {
      window.__tlMarkWebGLContext(this.canvas, this.gl);
    }

    // canvas 尺寸在 ensureSpineRuntime 加载完成后设置
  }

  // ==================== 资源加载（AnimationPlayer.loadSpine 模式）====================

  _getPathPrefix(path) {
    const i1 = path.lastIndexOf('/');
    const i2 = path.lastIndexOf('\\');
    return (i1 === -1 && i2 === -1) ? '' : path.substring(0, Math.max(i1, i2) + 1);
  }

  _createMissingRegion(loader, path) {
    const base = loader?.atlas?.regions?.[0] || null;
    const page = base?.page || loader?.atlas?.pages?.[0] || null;
    const texture = base?.texture || page?.texture || null;
    const region = {
      name: path,
      page,
      texture,
      renderObject: null,
      u: base?.u ?? 0,
      v: base?.v ?? 0,
      u2: base?.u ?? 0,
      v2: base?.v ?? 0,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      originalWidth: 1,
      originalHeight: 1,
      offsetX: 0,
      offsetY: 0,
      rotate: false,
      degrees: 0,
      _missingRegion: true,
    };
    region.renderObject = region;
    return region;
  }

  _createPlaceholderAttachment(spineLib, loader, type, name, path) {
    const region = this._createMissingRegion(loader, path);
    const attachment = type === 'mesh'
      ? new spineLib.MeshAttachment(name, path)
      : new spineLib.RegionAttachment(name, path);
    attachment.region = region;
    attachment.rendererObject = region;
    attachment._missingRegion = true;
    if (attachment.color) attachment.color.a = 0;
    if (type === 'region' && typeof attachment.setRegion === 'function') attachment.setRegion(region);
    if (type === 'mesh') {
      attachment.regionUVs = attachment.regionUVs || [];
      attachment.uvs = attachment.uvs || [];
      attachment.triangles = attachment.triangles || [];
      attachment.vertices = attachment.vertices || [];
      attachment.bones = attachment.bones || null;
      attachment.worldVerticesLength = attachment.worldVerticesLength || 0;
    }
    return attachment;
  }

  _hideMissingRegionAttachments(skeletonData) {
    for (const skin of skeletonData?.skins || []) {
      const slots = skin?.attachments || [];
      for (const slotAttachments of slots) {
        if (!slotAttachments) continue;
        for (const attachment of Object.values(slotAttachments)) {
          if (!attachment?._missingRegion) continue;
          if (attachment.color) attachment.color.a = 0;
        }
      }
    }
  }

  /**
   * 包装 AtlasAttachmentLoader，使缺失 region 时返回透明占位 attachment，
   * 避免 skeleton 解析阶段返回 null 后，deform 动画读取 attachment.bones 崩溃。
   */
  _createTolerantAttachmentLoader(loader, filename, spineLib) {
    const origNewRegion = loader.newRegionAttachment.bind(loader);
    const origNewMesh = loader.newMeshAttachment ? loader.newMeshAttachment.bind(loader) : null;
    const createPlaceholder = (type, name, path) => {
      console.warn(`[SpineRenderer] 缺失 region，使用透明占位 (${filename}): ${path}`);
      return this._createPlaceholderAttachment(spineLib, loader, type, name, path);
    };
    loader.newRegionAttachment = function (skin, name, path, ...rest) {
      try {
        return origNewRegion(skin, name, path, ...rest) || createPlaceholder('region', name, path);
      } catch (e) {
        if (e.message && e.message.includes('Region not found')) {
          return createPlaceholder('region', name, path);
        }
        throw e;
      }
    };
    if (origNewMesh) {
      loader.newMeshAttachment = function (skin, name, path, ...rest) {
        try {
          return origNewMesh(skin, name, path, ...rest) || createPlaceholder('mesh', name, path);
        } catch (e) {
          if (e.message && e.message.includes('Region not found')) {
            return createPlaceholder('mesh', name, path);
          }
          throw e;
        }
      };
    }
    return loader;
  }

  /**
   * 加载 Spine 资源（自动检测版本，使用对应版本的运行时）
   * 4.0+: 使用 assetManager.loadTextureAtlas（自动解析atlas+加载纹理）
   * 3.x:  使用手动解析atlas文本 + TextureAtlasReader + 逐个加载纹理
   */
  async loadSpineAssets(filename, skelType = 'skel') {
    skelType = skelType.toLowerCase();

    // 已加载（上下文恢复后 GL 资源由 _restoreSpineGLResources 重建，无需重载）
    if (this.loadedAssets[filename]) return true;

    // 检测版本（同时确定实际文件类型：skel 或 json）
    const version = await this._detectVersion(filename, skelType);
    let actualType = this._getActualSkelType(filename, skelType);
    if (actualType !== skelType) {
    // console.log("[十周年UI调试] loadSpineAssets: skelType变化", skelType, "→", actualType);
      skelType = actualType;
    }
    // console.log("[十周年UI调试] loadSpineAssets:", filename, "version=" + version, "skelType=" + skelType, "cordova=" + !!globalThis.window?.cordova);

    // 尝试加载
    let success = await this._doLoadSpine(filename, skelType, version);
    // console.log("[十周年UI调试] loadSpineAssets: _doLoadSpine结果=" + success, filename);

    // 如果 skel 格式加载失败，自动尝试 json 格式（文件可能是 .json 但 skelType 传错了）
    if (!success && skelType === 'skel') {
      // console.log("[十周年UI调试] loadSpineAssets: skel失败，尝试json");
      // 清除 skel 缓存，用 json 类型重新检测
      delete this._versionCache[filename + '|skel'];
      delete this._versionCache[filename + '|skel:actualType'];
      const jsonVersion = await this._detectVersion(filename, 'json');
      if (jsonVersion) {
        success = await this._doLoadSpine(filename, 'json', jsonVersion);
        // console.log("[十周年UI调试] loadSpineAssets: json重试结果=" + success, filename);
      }
    }

    return success;
  }

  /**
   * 实际执行 Spine 资源加载
   */
  async _doLoadSpine(filename, skelType, version) {
    // LRU 驱逐：加载新资源前先检查是否超限
    this._evictOldestAssets();

    // 获取对应版本的渲染组件
    const components = await this._getOrCreateComponents(version);
    if (!components) return false;

    const assetManager = components.assetManager;
    const isVer4 = version === '4.0' || version === '4.1' || version === '4.2';

    if (isVer4) {
      // 4.0+ 模式（与皮肤切换 Animation4_0.loadSpine 一致）
      // 使用 assetManager.loadTextureAtlas 自动处理 atlas 解析和纹理加载
      return new Promise((resolve) => {
        const onerror = () => {
          console.error(`[SpineRenderer] loadSpine: [${filename}] 加载失败.`);
          resolve(false);
        };
        if (skelType === 'json') {
          assetManager.loadText(filename + '.json', () => {
            assetManager.loadTextureAtlas(filename + '.atlas', () => {
              this.loadedAssets[filename] = { name: filename, skelType: skelType, version };
              this._pendingAssets.add(filename);
              this._pendingAssetsTime.set(filename, Date.now());
              this._trackAssetLoad(filename);
              resolve(true);
            }, onerror);
          }, onerror);
        } else {
          assetManager.loadBinary(filename + '.skel', () => {
            assetManager.loadTextureAtlas(filename + '.atlas', () => {
              this.loadedAssets[filename] = { name: filename, skelType: skelType, version };
              this._pendingAssets.add(filename);
              this._pendingAssetsTime.set(filename, Date.now());
              this._trackAssetLoad(filename);
              resolve(true);
            }, onerror);
          }, onerror);
        }
      });
    } else {
      // 3.x 模式（与皮肤切换 Animation3_6.loadSpine 一致）
      const spineLib = getSpineLib(version);
      return new Promise((resolve) => {
        const reader = {
          name: filename,
          skelType: skelType,
          loaded: 0,
          errors: 0,
          toLoad: 2,
          onerror: () => {
            reader.toLoad--;
            reader.errors++;
            if (reader.toLoad === 0) {
              console.error(`[SpineRenderer] loadSpine: [${filename}] 加载失败.`);
              resolve(false);
            }
          },
          onload: () => {
            reader.toLoad--;
            reader.loaded++;
            if (reader.toLoad === 0 && reader.errors === 0) {
              this.loadedAssets[filename] = { name: filename, skelType: skelType, version };
              this._pendingAssets.add(filename);
              this._pendingAssetsTime.set(filename, Date.now());
              this._trackAssetLoad(filename);
              resolve(true);
            } else if (reader.toLoad === 0) {
              resolve(false);
            }
          },
          // atlas 文本加载回调：解析 atlas 获取纹理页名，加载纹理
          ontextLoad: (path, data) => {
            const atlasReader = new spineLib.TextureAtlasReader(data);
            const prefix = this._getPathPrefix(filename);
            let imageName = null;

            for (; ;) {
              const line = atlasReader.readLine();
              if (line === null) break;
              const trimmed = line.trim();
              if (trimmed.length === 0) {
                imageName = null;
              } else if (!imageName) {
                imageName = trimmed;
                reader.toLoad++;
                assetManager.loadTexture(prefix + imageName, reader.onload, reader.onerror);
              }
            }

            reader.onload(path, data);
          },
        };

        if (skelType === 'json') {
          assetManager.loadText(filename + '.json', reader.onload, reader.onerror);
        } else {
          assetManager.loadBinary(filename + '.skel', reader.onload, reader.onerror);
        }

        assetManager.loadText(filename + '.atlas', reader.ontextLoad, reader.onerror);
      });
    }
  }

  // ==================== 骨骼创建（AnimationPlayer.prepSpine 模式）====================

  /**
   * 创建 SpineNode 实例（使用对应版本的 spineLib）
   */
  async createSpineNode(filename, meta = {}) {
    const skelType = meta.skelType || 'skel';
    const version = meta.version || this.loadedAssets[filename]?.version || await this._detectVersion(filename, skelType);

    const components = this.spineComponents[version];
    if (!components) {
      console.error(`[SpineRenderer] createSpineNode: 版本 ${version} 组件未就绪 (${filename})`);
      return null;
    }

    const assetManager = components.assetManager;
    const spineLib = getSpineLib(version);

    if (!assetManager.get(filename + '.atlas')) {
      console.warn(`[SpineRenderer] createSpineNode: [${filename}] atlas 未加载`, {
        version,
        assetKeys: Object.keys(assetManager.assets).filter(k => k.includes(filename.split('/').pop())),
        loadedAssets: !!this.loadedAssets[filename],
        loadedAssetsVersion: this.loadedAssets[filename]?.version,
      });
      return null;
    }

    try {
      const prefix = this._getPathPrefix(filename);

      // 4.0 使用 loadTextureAtlas（AssetManager 内置方法）
      // 3.x 使用 TextureAtlas + textureLoader 回调
      let skeletonData;
      let atlas; // 保留引用，用于预乘 alpha 纹理处理
      if (version === '4.0' || version === '4.1' || version === '4.2') {
        // 4.0+: AssetManager.loadTextureAtlas 已在 loadSpine 中被调用
        atlas = assetManager.get(filename + '.atlas');
        if (!atlas) {
          console.error(`[SpineRenderer] createSpineNode: [${filename}] 4.0+ atlas 对象未找到`);
          return null;
        }
        const atlasLoader = this._createTolerantAttachmentLoader(new spineLib.AtlasAttachmentLoader(atlas), filename, spineLib);
        if (skelType === 'json') {
          skeletonData = new spineLib.SkeletonJson(atlasLoader).readSkeletonData(assetManager.get(filename + '.json'));
        } else {
          skeletonData = new spineLib.SkeletonBinary(atlasLoader).readSkeletonData(assetManager.get(filename + '.skel'));
        }
      } else {
        // 3.x: TextureAtlas 构造函数接受 text + textureLoader 回调
        const atlasText = assetManager.get(filename + '.atlas');
        if (!atlasText) {
          console.error(`[SpineRenderer] createSpineNode: [${filename}] atlas 文本不存在于 assetManager`);
          return null;
        }
        atlas = new spineLib.TextureAtlas(atlasText, (name) => {
          return assetManager.get(prefix + name);
        });
        const attachmentLoader = this._createTolerantAttachmentLoader(new spineLib.AtlasAttachmentLoader(atlas), filename, spineLib);
        if (skelType === 'json') {
          skeletonData = new spineLib.SkeletonJson(attachmentLoader).readSkeletonData(assetManager.get(filename + '.json'));
        } else {
          skeletonData = new spineLib.SkeletonBinary(attachmentLoader).readSkeletonData(assetManager.get(filename + '.skel'));
        }
      }

      this._hideMissingRegionAttachments(skeletonData);

      // 创建 Skeleton 和 AnimationState
      const skeleton = new spineLib.Skeleton(skeletonData);
      skeleton.name = filename;
      skeleton.completed = true;
      skeleton.setSkinByName('default');
      skeleton.setToSetupPose();
      skeleton.updateWorldTransform();

      const state = new spineLib.AnimationState(new spineLib.AnimationStateData(skeletonData));

      // 计算 bounds
      const bounds = { offset: new spineLib.Vector2(), size: new spineLib.Vector2() };
      skeleton.getBounds(bounds.offset, bounds.size, []);

      // 创建节点
      const node = new SpineNode(skeleton, state, bounds, { ...meta, version });

      // 动画由 DynamicManager.setupSpineAnimation 设置，不在创建时重复设置
      // this._setupAnimation(node, meta);

      // MVP 矩阵
      const webgl = getSpineWebgl(version);
      node.mvp = new webgl.Matrix4();

      // 预乘 alpha 处理：不修改纹理像素，仅通过 skeletonRenderer.premultipliedAlpha=true
      // 让 spine 渲染器使用预乘混合模式（ONE, ONE_MINUS_SRC_ALPHA）
      // 注意：像素级预乘 + premultipliedAlpha=true = 双重预乘，会导致边框

      // 记录资源文件名 & 增加引用计数（用于纹理生命周期管理）
      node._assetFilename = filename;
      this._assetRefCount[filename] = (this._assetRefCount[filename] || 0) + 1;
      // 已被 createSpineNode 消费，移除 pending 保护（交给 refCount 保护）
      this._pendingAssets.delete(filename);
      this._pendingAssetsTime.delete(filename);
      // 更新 LRU 顺序（有活跃节点使用 = 最近访问）
      this._trackAssetLoad(filename);

      return node;
    } catch (e) {
      console.error(`[SpineRenderer] createSpineNode 失败 (${filename}):`, e?.message || e, '\n', e?.stack);
      return null;
    }
  }

  _setupAnimation(node, meta) {
    const skeleton = node.skeleton;
    const state = node.state;

    // 镜像
    if (meta.mirror) {
      skeleton.flipX = true;
    }

    // 旋转：通过 MVP 矩阵在 _renderNode 中统一处理（node.angle 已兼容 rotation）
    // 不再直接设置 rootBone.rotation，因为动画会立即覆盖它，且只有根骨骼子树会旋转

    // 播放动画
    if (meta.action) {
      const action = meta.action;
      if (Array.isArray(action)) {
        action.forEach((animName, index) => {
          const loop = index === action.length - 1;
          state.addAnimation(0, animName, loop, 0);
        });
      } else {
        state.setAnimation(0, action, meta.loop ?? true);
      }
    } else {
      const animations = skeleton.data.animations;
      const animNames = animations.map(a => a.name);
      const defaultAnim = animNames[animNames.length > 1 ? 1 : 0];
      state.setAnimation(0, defaultAnim, meta.loop ?? true);
    }

    // 动画完成回调。非循环特效在 complete 后标记完成并触发上层清理，避免停在最后一帧。
    if (meta.animationEnd || node.oncomplete || (meta.loop ?? true) === false) {
      state.addListener({
        complete: entry => {
          meta.animationEnd?.(entry);
          node.oncomplete?.(entry);
          if (entry?.loop === false || (meta.loop ?? true) === false) node.completed = true;
        },
      });
    }
  }

  // 创建容器
  createContainer(options = {}) {
    const container = new SpineContainer(options);
    container._renderer = this; // 反向引用，用于资源释放
    this.containers.push(container);
    return container;
  }

  // 销毁容器
  destroyContainer(container) {
    const idx = this.containers.indexOf(container);
    if (idx !== -1) this.containers.splice(idx, 1);
    // 释放容器中所有节点的资源引用
    for (const node of container.spineNodes) {
      if (node._assetFilename) {
        this._releaseSpineAsset(node._assetFilename);
      }
      // ImageNode 纹理清理
      if (!node.isSpine && node._image && this._imageTextures.has(node._image)) {
        const tex = this._imageTextures.get(node._image);
        if (this.gl && !this.gl.isContextLost()) {
          try { this.gl.deleteTexture(tex); } catch (e) {}
        }
        this._imageTextures.delete(node._image);
      }
    }
    container.destroy();
  }

  // ==================== 资源引用计数 & 纹理回收 ====================

  /**
   * 释放一个 spine 资源的引用。当引用计数归零时自动释放 GPU 纹理。
   */
  _releaseSpineAsset(filename) {
    if (!this._assetRefCount[filename]) return;
    this._assetRefCount[filename]--;
    if (this._assetRefCount[filename] <= 0) {
      delete this._assetRefCount[filename];
      this._disposeAssetTextures(filename);
      delete this.loadedAssets[filename];
      delete this._versionCache[filename + '|skel'];
      delete this._versionCache[filename + '|json'];
      const idx = this._assetLoadOrder.indexOf(filename);
      if (idx !== -1) this._assetLoadOrder.splice(idx, 1);
    }
  }

  /**
   * 释放指定 spine 资源的所有 GPU 纹理。
   * 遍历对应版本 assetManager 中匹配文件名前缀的资源，调用 GLTexture.dispose()。
   */
  _disposeAssetTextures(filename) {
    const meta = this._loadedAssetsMeta(filename);
    if (!meta) return;
    const components = this.spineComponents[meta.version];
    if (!components?.assetManager) return;
    const am = components.assetManager;
    const prefix = filename;
    // 收集匹配前缀的资源路径
    const keysToRemove = Object.keys(am.assets).filter(path =>
      path === prefix ||
      path === prefix + '.atlas' ||
      path === prefix + '.json' ||
      path === prefix + '.skel' ||
      path.startsWith(prefix + '/') ||
      path.startsWith(prefix + '\\')
    );
    for (const path of keysToRemove) {
      const asset = am.assets[path];
      if (asset && typeof asset.dispose === 'function') {
        try { asset.dispose(); } catch (e) {}
      }
      delete am.assets[path];
      // 清理 spine 运行时的内部引用计数
      if (am.assetsRefCount) delete am.assetsRefCount[path];
      if (am.assetsLoaded) delete am.assetsLoaded[path];
    }
  }

  /**
   * 获取已加载资源的元数据（包含 version）
   */
  _loadedAssetsMeta(filename) {
    // loadedAssets 中可能以 filename 本身为 key
    if (this.loadedAssets[filename]) return this.loadedAssets[filename];
    // 也可能是 _versionCache 中有版本信息
    const ver = this._versionCache[filename + '|skel'] || this._versionCache[filename + '|json'];
    if (ver) return { version: ver };
    return null;
  }

  /**
   * LRU 驱逐：当已加载资源超过上限时，驱逐最久未使用的无引用资源。
   * 在 loadSpineAssets 成功后调用。
   */
  _evictOldestAssets() {
    // 清理超过 30 秒的 pending 条目（防止异常情况下 pending 集合无限增长）
    const now = Date.now();
    for (const [f, t] of this._pendingAssetsTime) {
      if (now - t > 30000) {
        this._pendingAssets.delete(f);
        this._pendingAssetsTime.delete(f);
      }
    }

    while (this._assetLoadOrder.length > this._maxLoadedAssets) {
      let evicted = false;
      for (let i = 0; i < this._assetLoadOrder.length; i++) {
        const oldFile = this._assetLoadOrder[i];
        // 跳过 pending 状态的资源（并发加载期间，createSpineNode 尚未消费）
        if (this._pendingAssets.has(oldFile)) continue;
        if (!this._assetRefCount[oldFile] || this._assetRefCount[oldFile] <= 0) {
          this._disposeAssetTextures(oldFile);
          delete this.loadedAssets[oldFile];
          delete this._versionCache[oldFile + '|skel'];
          delete this._versionCache[oldFile + '|json'];
          this._assetLoadOrder.splice(i, 1);
          evicted = true;
          break; // 每次只驱逐一个
        }
      }
      if (!evicted) break; // 所有资源都在使用中，无法驱逐
    }
  }

  /**
   * 记录资源加载顺序（LRU 尾部），同时触发 LRU 驱逐检查。
   */
  _trackAssetLoad(filename) {
    // 移到尾部（如果已存在则更新顺序）
    const idx = this._assetLoadOrder.indexOf(filename);
    if (idx !== -1) this._assetLoadOrder.splice(idx, 1);
    this._assetLoadOrder.push(filename);
    this._evictOldestAssets();
  }

  // 从DOM元素获取边界
  // 返回值统一使用 canvas 可见区域内的 CSS 像素，避免 body/game documentZoom
  // 与 canvas 反向缩放互相叠加后造成定位偏移。
  _calcReferBounds(domNode) {
    const zoom = getDocumentZoom();
    const isNative = HTMLElement.prototype.getBoundingClientRect.toString().includes("[native code]");
    let rect = domNode.getBoundingClientRect();

    if (isNative) {
      // 原生 getBoundingClientRect 返回最终视觉坐标，直接使用。
    } else {
      // 部分扩展会劫持 getBoundingClientRect 并提前除以 documentZoom，
      // 这里还原为视觉坐标，后续再转为 canvas 本地坐标。
      rect = new DOMRect(rect.x * zoom, rect.y * zoom, rect.width * zoom, rect.height * zoom);
    }
    const canvasRect = this.canvas?.getBoundingClientRect?.() || { left: 0, top: 0, width: this.canvas?.clientWidth || window.innerWidth || 0, height: this.canvas?.clientHeight || window.innerHeight || 0 };
    const left = rect.left - canvasRect.left;
    const top = rect.top - canvasRect.top;
    const canvasHeight = canvasRect.height || this.canvas?.clientHeight || window.innerHeight || 0;
    return {
      x: left,
      y: canvasHeight - top - rect.height,
      width: rect.width,
      height: rect.height
    };
  }

  // 计算节点的渲染参数
  // 坐标系统设计（与旧版 pixi-spine 完全一致）：
  //   1. 所有中间坐标使用 CSS 像素（Y轴向下，原点左上角）
  //   2. 容器 x/y 也是 CSS 像素（screenX, screenY）
  //   3. 最后统一转 WebGL 物理像素（Y轴翻转 + DPR缩放）
  //
  // node._origMeta: 原始配置值（x/y/scale），由 resizeSpineNodes 缓存
  // node._containerRect: 容器尺寸，由 resizeSpineNodes 在创建/resize 时更新
  _updateNodeRenderParams(node, canvasWidth, canvasHeight, deltaTime) {
    if (node.destroyed) return;
    if (node.isSpine && !node.skeleton) return;
    node._clippedOut = false; // 每帧重置

    // 使用 canvas 实际 backing/display 比例，避免 documentZoom 与反向 transform 叠加后错位。
    const canvasScaleX = this._frameCanvasScaleX || this.dpr || 1;
    const canvasScaleY = this._frameCanvasScaleY || this.dpr || 1;
    const effectiveDpr = Math.min(canvasScaleX, canvasScaleY);

    // ========== CSS像素坐标计算（Y轴向下） ==========
    let cssX, cssY;

    if (node._origMeta && node._containerRect) {
      const origMeta = node._origMeta;
      const cr = node._containerRect;
      const DESIGN_WIDTH = 130;
      const DESIGN_HEIGHT = DESIGN_WIDTH * 1.35;

      const ratioX = cr.width / DESIGN_WIDTH;
      const ratioY = cr.height / DESIGN_HEIGHT;

      // X轴：配置值是距左边的比例
      if (Array.isArray(origMeta.x)) {
        cssX = (DESIGN_WIDTH * origMeta.x[1] + origMeta.x[0]) * ratioX;
      } else {
        cssX = (origMeta.x ?? 0.5) * DESIGN_WIDTH * ratioX;
      }

      // Y轴：配置值是距底部的比例（WebGL语义），需转 CSS（距顶部）
      // 与旧版 pixi-spine 的 resizeSpineNodes 公式一致
      if (Array.isArray(origMeta.y)) {
        cssY = (DESIGN_HEIGHT - (origMeta.y[0] + origMeta.y[1] * DESIGN_HEIGHT)) * ratioY;
      } else {
        cssY = (DESIGN_HEIGHT - (origMeta.y ?? 0.5) * DESIGN_HEIGHT) * ratioY;
      }
    } else {
      // 兼容：无 _origMeta 时使用旧逻辑
      const calc = (value, refer) => {
        return Array.isArray(value) ? value[0] + value[1] * refer : value;
      };

      let refWidth = canvasWidth / canvasScaleX;
      let refHeight = canvasHeight / canvasScaleY;

      const refNode = node.referNode instanceof HTMLElement ? node.referNode : null;
      if (refNode) {
        if (!node.referFollow && node.referBounds) {
          // 使用缓存的 bounds
        } else {
          node.referBounds = this._calcReferBounds(refNode);
        }
        // referBounds 已经是 WebGL 坐标，转回 CSS
        refHeight = node.referBounds.height;
        refWidth = node.referBounds.width;
      }

      cssX = calc(node.x, refWidth);
      cssY = calc(node.y, refHeight);
    }

    // ========== 容器变换叠加（CSS像素） ==========
    // 利用帧级缓存的容器链累积变换，避免每个 node 重复遍历容器链
    // 容器在 render() 开头 _dirtyFrame !== currentFrame 时标记需要重新计算
    let accumX, accumY, accumScaleX, accumScaleY;
    const _frameId = this._frameId;
    const innerContainer = node.container;
    if (innerContainer && innerContainer._worldTransformFrame === _frameId) {
      // 容器链已在本帧计算过，直接使用缓存
      accumX = innerContainer._worldAccumX;
      accumY = innerContainer._worldAccumY;
      accumScaleX = innerContainer._worldAccumScaleX;
      accumScaleY = innerContainer._worldAccumScaleY;
    } else if (innerContainer) {
      // 使用递归缓存计算
      this._computeContainerWorldTransform(innerContainer, _frameId);
      accumX = innerContainer._worldAccumX;
      accumY = innerContainer._worldAccumY;
      accumScaleX = innerContainer._worldAccumScaleX;
      accumScaleY = innerContainer._worldAccumScaleY;
    } else {
      accumX = 0; accumY = 0; accumScaleX = 1; accumScaleY = 1;
    }
    cssX = cssX * accumScaleX + accumX;
    cssY = cssY * accumScaleY + accumY;
    const contScaleX = accumScaleX;
    const contScaleY = accumScaleY;

    // ========== 参考节点偏移（CSS像素） ==========
    const refNode = node.referNode instanceof HTMLElement ? node.referNode : null;
    if (refNode && node.referBounds) {
      if (node.referFollow || !node.referBounds) {
        node.referBounds = this._calcReferBounds(refNode);
      }
      if (node.referBounds) {
        // referBounds.x 是 CSS left，referBounds.y 已经是 WebGL（距底部）
        // 需要转回 CSS（距顶部）
        cssX += node.referBounds.x;
        cssY += ((this._frameCanvasCssHeight || canvasHeight / canvasScaleY) - node.referBounds.y - node.referBounds.height);
      }
    }

    // ========== CSS → WebGL 坐标转换 ==========
    // X: 直接缩放
    // Y: 翻转 + 缩放 (WebGL Y = canvasHeight - CSS_Y * dpr)
    let renderX = cssX * canvasScaleX;
    let renderY = canvasHeight - cssY * canvasScaleY;

    // ========== 缩放计算 ==========
    let renderScale;
    let debugAutoScaleX = null;
    let debugAutoScaleY = null;

    if (!node.isSpine && node._naturalWidth) {
      // ImageNode: cover 模式，图片铺满容器
      const cr = node._containerRect;
      const natW = node._naturalWidth;
      const natH = node._naturalHeight;
      if (cr && cr.width > 0 && cr.height > 0) {
        const calcScale = (value, refer) => {
          return Array.isArray(value) ? value[0] + value[1] * refer : value;
        };
        if (node.meta?.fit === 'stretch' && node.meta.width !== undefined && node.meta.height !== undefined) {
          node._renderImageWidth = calcScale(node.meta.width, cr.width) * canvasScaleX * contScaleX;
          node._renderImageHeight = calcScale(node.meta.height, cr.height) * canvasScaleY * contScaleY;
          console.log(`[ImageNode-stretch] cr=${JSON.stringify(cr)}, w=${JSON.stringify(node.meta.width)}, h=${JSON.stringify(node.meta.height)}, _rw=${node._renderImageWidth}, _rh=${node._renderImageHeight}, dpr=${effectiveDpr}, zoom=${this._frameZoom}, csx=${contScaleX}, csy=${contScaleY}`);
          renderScale = 1;
        } else {
          const sx = cr.width / natW * 1.2;
          const sy = cr.height / natH;
          renderScale = Math.max(sx, sy);
          console.log(`[ImageNode-cover] cr=${JSON.stringify(cr)}, natW=${natW}, natH=${natH}, sx=${sx.toFixed(4)}, sy=${sy.toFixed(4)}, renderScale=${renderScale.toFixed(4)}, fit=${node.meta?.fit}`);
          node._renderImageWidth = null;
          node._renderImageHeight = null;
        }
      } else {
        renderScale = 1;
        node._renderImageWidth = null;
        node._renderImageHeight = null;
      }
      renderScale *= effectiveDpr;
      renderScale *= Math.min(contScaleX, contScaleY);
    } else {
      // SpineNode: 原有缩放逻辑
      const boundsSize = node.bounds.size;
      let scaleX, scaleY;
      const cr = node._containerRect;
      const calcScale = (value, refer) => {
        return Array.isArray(value) ? value[0] + value[1] * refer : value;
      };
      if (node.meta.width !== undefined && cr) {
        scaleX = calcScale(node.meta.width, cr.width) / boundsSize.x;
      }
      if (node.meta.height !== undefined && cr) {
        scaleY = calcScale(node.meta.height, cr.height) / boundsSize.y;
      }
      debugAutoScaleX = scaleX ?? null;
      debugAutoScaleY = scaleY ?? null;
      // 支持 node.scaleX / node.scaleY 独立缩放
      renderScale = node.scale ?? 1;
      if (scaleX && !scaleY) renderScale *= scaleX;
      else if (!scaleX && scaleY) renderScale *= scaleY;
      else if (scaleX && scaleY) renderScale *= Math.min(scaleX, scaleY);
      else {
        if (node._baseScale !== undefined) {
          renderScale = node._baseScale * renderScale;
        }
        renderScale *= effectiveDpr;
        if (node._scaleWithDocumentZoom) {
          renderScale *= this._frameZoom || 1;
        }
      }
      renderScale *= Math.min(contScaleX, contScaleY);
      // 独立 X/Y 缩放比例（在 _renderNode 中用于 MVP 矩阵）
      const baseScaleX = node.scaleX ?? 1;
      const baseScaleY = node.scaleY ?? 1;
      // 如果 scaleX/scaleY 有配置值，X/Y 缩放已被上面的逻辑统一处理
      // 这里只在没有显式 width/height 配置时，将 node.scaleX/Y 的差异映射到 renderScale
      node._renderScaleX = (scaleX || scaleY) ? renderScale : renderScale * baseScaleX / node.scale;
      node._renderScaleY = (scaleX || scaleY) ? renderScale : renderScale * baseScaleY / node.scale;
    }

    node.renderX = renderX;
    node.renderY = renderY;
    node.renderScale = renderScale;
    node.renderAngle = node.angle || 0;
    node.renderOpacity = (node.opacity ?? 1) * (innerContainer ? (innerContainer._worldAccumAlpha ?? 1) : 1);
    if (isAnimationDebugEnabled(innerContainer?.name, node.skeleton?.name, node.name, node.meta?.name) && (node._animDebugLogCount || 0) < 3) {
      node._animDebugLogCount = (node._animDebugLogCount || 0) + 1;
      const canvasRect = this.canvas.getBoundingClientRect();
      const cssRenderX = renderX / canvasScaleX;
      const cssRenderY = (canvasHeight - renderY) / canvasScaleY;
      const payload = {
        containerName: innerContainer?.name,
        fatherClass: innerContainer?.fatherDOM?.className,
        skeleton: node.skeleton?.name || node.name || node.meta?.name,
        zoom: {
          documentZoom: getDocumentZoom(),
          bodyZoom: parseFloat(window.getComputedStyle(document.body).zoom) || 1,
          gameZoom: globalThis.game?.documentZoom,
          windowZoom: window.documentZoom,
        },
        canvas: {
          clientWidth: this.canvas.clientWidth,
          clientHeight: this.canvas.clientHeight,
          width: this.canvas.width,
          height: this.canvas.height,
          rect: toPlainRect(canvasRect),
          dpr: this.dpr,
          effectiveDpr,
          frameZoom: this._frameZoom,
          styleTransform: this.canvas.style.transform,
        },
        container: innerContainer
          ? {
              x: innerContainer.x,
              y: innerContainer.y,
              width: innerContainer._contentWidth,
              height: innerContainer._contentHeight,
              accumX,
              accumY,
              accumScaleX,
              accumScaleY,
            }
          : null,
        node: {
          origMeta: node._origMeta,
          containerRect: node._containerRect,
          metaScale: node.meta?.scale,
          metaWidth: node.meta?.width,
          metaHeight: node.meta?.height,
          nodeScale: node.scale,
          nodeScaleX: node.scaleX,
          nodeScaleY: node.scaleY,
          baseScale: node._baseScale,
          scaleWithDocumentZoom: !!node._scaleWithDocumentZoom,
          computedWidthScale: debugAutoScaleX,
          computedHeightScale: debugAutoScaleY,
          localCssX: cssX - accumX,
          localCssY: cssY - accumY,
          cssX,
          cssY,
          cssRenderX,
          cssRenderY,
          renderX,
          renderY,
          renderScale,
          renderScaleX: node._renderScaleX ?? renderScale,
          renderScaleY: node._renderScaleY ?? renderScale,
          bounds: node.bounds?.size ? { x: node.bounds.size.x, y: node.bounds.size.y } : null,
        },
      };
      pushDebugHistory("node", payload);
      console.warn("[DCD-ANIM node]", safeDebugString(payload));
    }

    // ========== 遮罩 ==========
    if (node.clip) {
      node.renderClip = {
        x: node.clip.x * canvasScaleX,
        y: canvasHeight - ((node.clip.y ?? 0) + (node.clip.height ?? 0)) * canvasScaleY,
        width: node.clip.width * canvasScaleX,
        height: node.clip.height * canvasScaleY,
      };
    } else {
      node.renderClip = null;
    }

    // 容器级遮罩（从容器链收集所有 mask，求交集）
    const containerMasks = node.container ? this._collectContainerMasks(node.container) : [];

    // 计算每个 mask 在屏幕上的 CSS 像素区域，然后求交集
    // 遮罩坐标是相对于各自容器的局部坐标，需用与节点位置相同的累积方式计算世界坐标
    // 即 maskWorldX = 父层累积X + maskLocalX * 该层累积缩放
    let finalClipX = 0, finalClipY = 0;
    let finalClipW = canvasWidth / canvasScaleX, finalClipH = canvasHeight / canvasScaleY;
    let effectiveMask = null;
    let effectiveMaskContext = null;
    const _maskDebugEnabled = this._maskDebugEnabled;

    if (containerMasks.length > 0) {
      // 先缓存所有 mask 容器的世界变换（复用帧级缓存避免重复遍历）
      for (const { container: maskCont } of containerMasks) {
        if (maskCont._worldTransformFrame !== _frameId) {
          this._computeContainerWorldTransform(maskCont, _frameId);
        }
      }

      // 从最外层向最内层遍历，逐层求交集
      for (let i = containerMasks.length - 1; i >= 0; i--) {
        const { mask: m, container: maskContainer } = containerMasks[i];
        // 使用帧级缓存的世界变换
        const maskAccumX = maskContainer._worldAccumX;
        const maskAccumY = maskContainer._worldAccumY;
        const maskAccumScaleX = maskContainer._worldAccumScaleX;
        const maskAccumScaleY = maskContainer._worldAccumScaleY;
        // mask 的局部坐标乘以该容器的累积缩放
        const mCssX = (m.x ?? 0) * maskAccumScaleX + maskAccumX;
        const mCssY = (m.y ?? 0) * maskAccumScaleY + maskAccumY;
        const mCssW = (m.width ?? canvasWidth / canvasScaleX) * maskAccumScaleX;
        const mCssH = (m.height ?? canvasHeight / canvasScaleY) * maskAccumScaleY;

        if (_maskDebugEnabled) {
          console.log(`[MASK-DEBUG] 容器遮罩交集 i=${i}: mask[${i}].type=${m.type}, ` +
            `maskLocal=(${m.x},${m.y},${m.width},${m.height}), ` +
            `accumPos=(${maskAccumX.toFixed(1)},${maskAccumY.toFixed(1)}), accumScale=(${maskAccumScaleX.toFixed(3)},${maskAccumScaleY.toFixed(3)}), ` +
            `maskWorld=(${mCssX.toFixed(1)},${mCssY.toFixed(1)},${mCssW.toFixed(1)},${mCssH.toFixed(1)}), ` +
            `当前finalClip=(${finalClipX.toFixed(1)},${finalClipY.toFixed(1)},${finalClipW.toFixed(1)},${finalClipH.toFixed(1)})`);
        }

        // 求交集
        const interLeft = Math.max(finalClipX, mCssX);
        const interTop = Math.max(finalClipY, mCssY);
        const interRight = Math.min(finalClipX + finalClipW, mCssX + mCssW);
        const interBottom = Math.min(finalClipY + finalClipH, mCssY + mCssH);

        if (interRight <= interLeft || interBottom <= interTop) {
          // 交集为空——完全不可见
          finalClipW = 0;
          finalClipH = 0;
          if (_maskDebugEnabled) console.log(`[MASK-DEBUG] 交集为空！`);
          break;
        }
        finalClipX = interLeft;
        finalClipY = interTop;
        finalClipW = interRight - interLeft;
        finalClipH = interBottom - interTop;

        if (_maskDebugEnabled) {
          console.log(`[MASK-DEBUG] → 交集后 finalClip=(${finalClipX.toFixed(1)},${finalClipY.toFixed(1)},${finalClipW.toFixed(1)},${finalClipH.toFixed(1)})`);
        }

        // 矩形只需通过 scissor 求交；复杂路径优先作为最终 stencil。
        // 双将的半宽矩形因此不会覆盖父层横跨整个 Player 的弧顶路径。
        if (!effectiveMask || getMaskStencilPriority(m) >= getMaskStencilPriority(effectiveMask)) {
          effectiveMask = m;
          effectiveMaskContext = {
            accumX: maskAccumX,
            accumY: maskAccumY,
            scaleX: maskAccumScaleX,
            scaleY: maskAccumScaleY,
          };
        }
      }
    }

    // 节点级层遮罩（如 bgImg/spineBg 的 bgMask）
    // layerMask 坐标是相对于所属容器的局部坐标，需要用与节点相同的累积方式计算世界坐标
    if (node.layerMask && finalClipW > 0 && finalClipH > 0) {
      const lm = node.layerMask;
      // layerMask 是 node.container 的属性，世界位置 = accumX + lmLocalX * accumScaleX
      const lmCssX = (lm.x ?? 0) * accumScaleX + accumX;
      const lmCssY = (lm.y ?? 0) * accumScaleY + accumY;
      const lmCssW = (lm.width ?? canvasWidth / canvasScaleX) * accumScaleX;
      const lmCssH = (lm.height ?? canvasHeight / canvasScaleY) * accumScaleY;

      if (_maskDebugEnabled) {
        console.log(`[MASK-DEBUG] layerMask: type=${lm.type}, local=(${lm.x},${lm.y},${lm.width},${lm.height}), ` +
          `accumPos=(${accumX.toFixed(1)},${accumY.toFixed(1)}), accumScale=(${accumScaleX.toFixed(3)},${accumScaleY.toFixed(3)}), ` +
          `lmWorld=(${lmCssX.toFixed(1)},${lmCssY.toFixed(1)},${lmCssW.toFixed(1)},${lmCssH.toFixed(1)}), ` +
          `当前finalClip=(${finalClipX.toFixed(1)},${finalClipY.toFixed(1)},${finalClipW.toFixed(1)},${finalClipH.toFixed(1)})`);
      }

      const interLeft = Math.max(finalClipX, lmCssX);
      const interTop = Math.max(finalClipY, lmCssY);
      const interRight = Math.min(finalClipX + finalClipW, lmCssX + lmCssW);
      const interBottom = Math.min(finalClipY + finalClipH, lmCssY + lmCssH);

      if (interRight <= interLeft || interBottom <= interTop) {
        finalClipW = 0;
        finalClipH = 0;
        if (_maskDebugEnabled) console.log(`[MASK-DEBUG] layerMask 交集为空！`);
      } else {
        finalClipX = interLeft;
        finalClipY = interTop;
        finalClipW = interRight - interLeft;
        finalClipH = interBottom - interTop;
        if (!effectiveMask || getMaskStencilPriority(lm) >= getMaskStencilPriority(effectiveMask)) {
          effectiveMask = lm;
          effectiveMaskContext = {
            accumX,
            accumY,
            scaleX: accumScaleX,
            scaleY: accumScaleY,
          };
        }
        if (_maskDebugEnabled) {
          console.log(`[MASK-DEBUG] → layerMask 交集后 finalClip=(${finalClipX.toFixed(1)},${finalClipY.toFixed(1)},${finalClipW.toFixed(1)},${finalClipH.toFixed(1)})`);
        }
      }
    }

    if ((containerMasks.length > 0 || node.layerMask) && finalClipW > 0 && finalClipH > 0) {
      let renderMaskConfig = effectiveMask;
      if (effectiveMask && effectiveMaskContext) {
        const { accumX: maskAccumX, accumY: maskAccumY, scaleX: maskAccumScaleX, scaleY: maskAccumScaleY } = effectiveMaskContext;
        renderMaskConfig = {
          ...effectiveMask,
          _stencilOffsetX: (finalClipX - maskAccumX) / maskAccumScaleX - (effectiveMask.x ?? 0),
          _stencilOffsetY: (finalClipY - maskAccumY) / maskAccumScaleY - (effectiveMask.y ?? 0),
          _containerScaleX: maskAccumScaleX,
          _containerScaleY: maskAccumScaleY,
        };
      }
      node.renderClip = {
        x: finalClipX * canvasScaleX,
        y: canvasHeight - (finalClipY + finalClipH) * canvasScaleY,
        width: finalClipW * canvasScaleX,
        height: finalClipH * canvasScaleY,
      };
      node.renderMaskType = effectiveMask?.type || 'rect';
      node.renderMaskConfig = renderMaskConfig;
      node._clippedOut = false;
    } else if (containerMasks.length > 0 || node.layerMask) {
      // 遮罩交集为空，完全不可见
      node.renderClip = { x: 0, y: 0, width: 0, height: 0 };
      node.renderMaskType = 'rect';
      node.renderMaskConfig = null;
      node._clippedOut = true;
      // spineBg 一次性详细诊断
    } else if (node.clip) {
      node.renderMaskType = 'rect';
      node.renderMaskConfig = null;
    } else {
      node.renderMaskType = null;
      node.renderMaskConfig = null;
    }
  }

  // 主渲染循环（AnimationPlayer.render 模式 + 容器/遮罩支持）
  render(timestamp) {
    try {
      const canvas = this.canvas;
      const gl = this.gl;
      if (!gl || Object.keys(this.spineComponents).length === 0) { this.running = false; return; }

      // WebGL 上下文丢失保护：上下文丢失时暂停渲染，等待恢复事件
      if (gl.isContextLost()) {
        if (!this._contextLost) {
          this._contextLost = true;
          this.running = false;
          this.requestId = undefined;
          console.warn('[SpineRenderer] WebGL 上下文已丢失，停止渲染循环（等待恢复）');
          this._startContextRecoveryPolling();
        }
        return;
      }
      // 上下文恢复后：重置标记 + 恢复 GL 资源
      if (this._contextLost) {
        this._contextLost = false;
        this._restoreSpineGLResources();
        this._imageTextures.clear();
        this._imageProgram = null;
        this._imageLoc = null;
        this._imageQuadBuffer = null;
        this.resized = false;
        console.warn('[SpineRenderer] 上下文恢复，GL 资源已重建');
      }

      // 清除上一帧可能残留的 GL 错误（spineRenderer.draw 内部可能产生 GL_INVALID_OPERATION，
      // 这些错误会残留到下一帧的 ImageNode 渲染中被误报）
      while (gl.getError() !== gl.NO_ERROR) { }

      // 每帧更新 dpr（zoom 只计算一次，避免每个 node 重复调用 getComputedStyle）
      this.dpr = this.dprAdaptive
        ? Math.max(window.devicePixelRatio * getDocumentZoom(), 1)
        : this.dpr;
      const dpr = this.dpr;
      this._frameZoom = this.dprAdaptive
        ? getDocumentZoom()
        : 1;
      this._frameId = (this._frameId || 0) + 1;
      const _frameId = this._frameId;
      const _renderStart = performance.now();
      const delta = timestamp - (this.frameTime ?? timestamp);
      this.frameTime = timestamp;

      // 画布尺寸
      if (!this.resized) {
        this.updateCanvasSize(true);
      }
      const frameCanvasRect = canvas.getBoundingClientRect?.();
      this._frameCanvasRect = frameCanvasRect;
      const frameCanvasCssWidth = frameCanvasRect?.width || canvas.clientWidth || canvas.width / dpr || 1;
      const frameCanvasCssHeight = frameCanvasRect?.height || canvas.clientHeight || canvas.height / dpr || 1;
      this._frameCanvasCssWidth = frameCanvasCssWidth;
      this._frameCanvasCssHeight = frameCanvasCssHeight;
      this._frameCanvasScaleX = canvas.width / frameCanvasCssWidth || dpr;
      this._frameCanvasScaleY = canvas.height / frameCanvasCssHeight || dpr;
      this._frameEffectiveDpr = Math.min(this._frameCanvasScaleX, this._frameCanvasScaleY);

      // 允许需要紧跟 DOM 的容器在真正绘制前同步位置。
      // 卡牌移动时可避免独立 layout RAF 与 render RAF 顺序不同造成的一帧延迟。
      for (const container of [...this.containers]) {
        container._beforeRender?.();
      }

      // 收集所有需要渲染的节点
      const activeNodes = [];

      // 诊断：每个新容器首次出现 spineNodes 时打印（不受全局计数限制）
      // for (const c of this.containers) {
      //   if (c.spineNodes.length > 0 && !c._diagPrinted) {
      //     c._diagPrinted = true;
      //     const vis = this._isContainerVisible(c);
      //     console.log(`[container-diag] id=${c.id} nodes=${c.spineNodes.length} vis=${vis} parent=${c.parentContainer?.id} spineType=${c._spineType}`);
      //   }
      // }

      const renderContainers = [...this.containers].sort((a, b) => (a.zIndex - b.zIndex) || (a.id - b.id));
      for (const container of renderContainers) {
        const vis = this._isContainerVisible(container);
        if (!vis) continue;
        for (const node of container.spineNodes) {
          if (!node.destroyed && !node.completed && node.visible !== false) {
            // 防御性检查：跳过内部状态不完整的节点
            if (node.isSpine && !node.skeleton) continue;
            if (!node.isSpine && !node._image) continue;
            activeNodes.push(node);
          }
          // else if (!node._skipDiagPrinted) {
          //   node._skipDiagPrinted = true;
          //   console.log(`[activeNode-skip] container=${node.container?.id} destroyed=${node.destroyed} completed=${node.completed} isSpine=${node.isSpine} skeleton=${!!node.skeleton}`);
          // }
        }
      }

      if (activeNodes.length === 0) {
        // 不立即停止，延迟几帧再停。
        // 原因：playSpine 可能在 onCreate 中调用（onShow 之前），
        // 此时容器 visible=false，activeNodes 为空。延迟给 onShow 时间让容器变可见。
        this._emptyFrames = (this._emptyFrames || 0) + 1;
        // 即使没有活跃节点也要清除画布，避免旧画面残留
        // （pack 切换时旧 dyContainer.visible=false 后、新 pack cells 恢复前的空窗期）
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (this._emptyFrames > 30) {
          // 持续30帧无活跃节点，安全停止
          this.running = false;
          this.requestId = undefined;
          this._emptyFrames = 0;
          return;
        }
        // 继续运行，等待容器变可见
        this.requestId = requestAnimationFrame((t) => this.render(t));
        return;
      }
      this._emptyFrames = 0;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.STENCIL_TEST);

      // 更新和渲染每个节点
      for (const node of activeNodes) {
        this._updateNodeRenderParams(node, canvas.width, canvas.height, delta);

        // 节点级渲染诊断（每个节点首次出现时打印一次）
        // if (!node._renderDiagPrinted) {
        //   node._renderDiagPrinted = true;
        //   console.log(`[node-render-diag] container=${node.container?.id} isSpine=${node.isSpine} skeleton=${!!node.skeleton} _clippedOut=${node._clippedOut} _clickHidden=${!!node._clickHidden} opacity=${node.renderOpacity?.toFixed(3)} scale=${node.renderScale?.toFixed(4)} pos=(${node.renderX?.toFixed(1)},${node.renderY?.toFixed(1)}) bounds=${JSON.stringify(node.bounds?.size)} destroyed=${node.destroyed} completed=${node.completed}`);
        // }

        // 跳过被遮罩完全裁剪掉的节点或明确隐藏的节点
        if (node._clippedOut || node._clickHidden || node.visible === false) {
          continue;
        }

        if (!node.isSpine) {
          // ImageNode: 直接渲染图片纹理
          this._renderImageNode(node, gl);
        } else if (node.skeleton) {
          // SpineNode: 更新动画状态
          // 注意：state.update 可能同步触发 complete 回调，回调内可能 destroy 节点（skeleton=null）
          // 因此在 state.update 之前缓存 skeleton 引用
          const skeleton = node.skeleton;
          const state = node.state;
          const isVer4 = node.version === '4.0' || node.version === '4.1' || node.version === '4.2';
          if (isVer4) {
            skeleton.scaleX = Math.abs(skeleton.scaleX) * (node.flipX ? -1 : 1);
            skeleton.scaleY = Math.abs(skeleton.scaleY) * (node.flipY ? -1 : 1);
            skeleton.color.a = node.renderOpacity;
          } else {
            skeleton.flipX = node.flipX;
            skeleton.flipY = node.flipY;
            skeleton.opacity = node.renderOpacity;
          }
          if (state) {
            state.hideSlots = node.hideSlots;
            state.update(delta / 1000 * node.speed);
            if (!node._destroyed && node.skeleton) state.apply(skeleton);
          }
          // destroy 后 skeleton 可能为 null，用缓存引用
          if (skeleton && !node._destroyed) {
            skeleton.updateWorldTransform();
          }
          if (!node._destroyed) {
            this._renderNode(node, gl);
          }
        }
      }

      this.requestId = requestAnimationFrame(this.render.bind(this));
      // 帧耗时统计（每120帧打印一次）
      this._perfFrameCount = (this._perfFrameCount || 0) + 1;
      this._perfTotalMs = (this._perfTotalMs || 0) + (performance.now() - _renderStart);
      if (this._perfFrameCount >= 120) {
        this._perfFrameCount = 0;
        this._perfTotalMs = 0;
      }
      // 重置 CSS transform 补偿（spine 已渲染到正确位置，不再需要视觉偏移）
      if (this._dragCompensateY) {
        this._dragCompensateY = 0;
        this.canvas.style.transform = '';
      }
    } catch (e) {
      // shaderSource TypeError 通常意味着 WebGL 上下文已丢失或被浏览器回收
      if (e instanceof TypeError && e.message && e.message.includes('shaderSource')) {
        console.error('[SpineRenderer] render: WebGL shader 错误（上下文可能丢失）:', e.message);
        // 不清空 spineComponents，保留给上下文恢复时 restore 使用
        this._contextLost = true;
      }
      console.error('[SpineRenderer] render循环异常:', e?.message || e, '\n', e?.stack);
      this.running = false;
      this.requestId = undefined;
      // 上下文丢失时启动恢复轮询（等待 webglcontextrestored 事件）
      if (this._contextLost) {
        this._startContextRecoveryPolling();
      } else {
        setTimeout(() => this.start(), 1000);
      }
    }
  }

  /**
   * 将 canvas 移入一个与指定矩形重合的裁切容器（overflow:hidden），
   * 使得 CSS transform translateY 移动 canvas 后，超出裁切区域的部分被自动裁切。
   * canvas 通过负 top/left 偏移保持视口坐标系不变，不影响 WebGL 渲染。
   * 重复调用时仅更新裁切容器位置和 canvas 偏移（不重建 DOM）。
   * @param {DOMRect|{left,top,right,bottom,width,height}} rect - 裁切区域的屏幕坐标
   */
  setCanvasClipRect(rect) {
    if (this._clipWrapper) {
      // 已有裁切容器，仅更新位置（避免 DOM 重建导致的闪烁）
      this._clipWrapper.style.left = rect.left + 'px';
      this._clipWrapper.style.top = rect.top + 'px';
      this._clipWrapper.style.width = rect.width + 'px';
      this._clipWrapper.style.height = rect.height + 'px';
      this.canvas.style.left = -rect.left + 'px';
      this.canvas.style.top = -rect.top + 'px';
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute;overflow:hidden;pointer-events:none;z-index:0;';
    wrapper.style.left = rect.left + 'px';
    wrapper.style.top = rect.top + 'px';
    wrapper.style.width = rect.width + 'px';
    wrapper.style.height = rect.height + 'px';
    // canvas 通过负偏移保持视口坐标：canvas 的 (0,0) = 视口左上角
    // 在 wrapper 内，canvas 需要 left=-rect.left, top=-rect.top
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = -rect.left + 'px';
    this.canvas.style.top = -rect.top + 'px';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.willChange = 'transform';
    this._canvasOriginalParent.appendChild(wrapper);
    wrapper.appendChild(this.canvas);
    this._clipWrapper = wrapper;
    // 强制重排后标记需要 resize（canvas CSS 尺寸变了）
    this.resized = false;
  }

  /**
   * 移除裁切容器，将 canvas 恢复到原始父容器。
   */
  clearCanvasClip() {
    if (!this._clipWrapper) return;
    // 保存当前 CSS transform（可能仍有 compensateY）
    const currentTransform = this.canvas.style.transform;
    this._clipWrapper.removeChild(this.canvas);
    this._clipWrapper.parentElement.removeChild(this._clipWrapper);
    this._clipWrapper = null;
    // 恢复 canvas CSS
    this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;will-change:transform;';
    this.canvas.className = (this.canvas.className || '') + ' spine-renderer';
    if (currentTransform) this.canvas.style.transform = currentTransform;
    this._canvasOriginalParent.appendChild(this.canvas);
    this.resized = false;
  }

  _renderNode(node, gl) {
    try {
      const version = node.version;
      const components = this.spineComponents[version];
      if (!components) {
        console.warn(`[SpineRenderer] _renderNode: 版本 ${version} 组件未找到`);
        return;
      }
      const { shader, batcher, skeletonRenderer } = components;
      const webgl = getSpineWebgl(version);
      const MVP_MATRIX = webgl.Shader.MVP_MATRIX;

      // 遮罩
      const useStencil = node.renderMaskType && node.renderMaskType !== 'rect';
      if (useStencil) {
        // 复杂遮罩：使用 stencil buffer
        this._applyStencilMask(gl, node);
      } else if (node.renderClip) {
        // 矩形遮罩：使用 scissor
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(
          node.renderClip.x, node.renderClip.y,
          node.renderClip.width, node.renderClip.height
        );
      }

      // MVP 矩阵构建（AnimationPlayer 模式）
      const mvp = node.mvp;
      mvp.ortho2d(0, 0, this.canvas.width, this.canvas.height);

      const tx = node.renderX ?? 0;
      const ty = node.renderY ?? 0;
      if (tx !== 0 || ty !== 0) {
        mvp.translate(tx, ty, 0);
      }

      // 旋转
      if (node.renderAngle) {
        mvp.rotate(node.renderAngle, 0, 0, 1);
      }

      // 缩放（支持独立 X/Y）
      const rsX = node._renderScaleX ?? node.renderScale;
      const rsY = node._renderScaleY ?? node.renderScale;
      if (rsX !== 1 || rsY !== 1) {
        mvp.scale(rsX, rsY, 1);
      }

      // 绑定 shader 并设置 MVP uniform（AnimationPlayer 模式）
      // 注意：blend 模式由 skeletonRenderer + batcher 内部自动管理
      // skeletonRenderer.premultipliedAlpha 控制顶点颜色预乘和 blend 模式选择
      shader.bind();
      shader.setUniform4x4f(MVP_MATRIX, node.mvp.values);
      shader.setUniformi("u_texture", 0);
      batcher.begin(shader);
      skeletonRenderer.premultipliedAlpha = node.premultipliedAlpha;
      skeletonRenderer.hideSlots = node.hideSlots;
      skeletonRenderer.disableMask = node.disableMask;

      // 诊断：首次渲染时打印 WebGL blend 状态
      if (!node._blendDiag) {
        node._blendDiag = true;
        const blend = gl.getParameter(gl.BLEND_SRC_RGB);
        const blendDst = gl.getParameter(gl.BLEND_DST_RGB);
      }

      skeletonRenderer.draw(batcher, node.skeleton);
      batcher.end();
      shader.unbind();

      // 恢复遮罩
      if (useStencil) {
        if (node._stencilActive) {
          this._clearStencilMask(gl);
          node._stencilActive = false;
        } else {
          gl.disable(gl.SCISSOR_TEST);
        }
      } else if (node.renderClip) {
        gl.disable(gl.SCISSOR_TEST);
      }
    } catch (e) {
      // shaderSource TypeError 通常意味着 WebGL 上下文已丢失或被浏览器回收
      if (e instanceof TypeError && e.message && e.message.includes('shaderSource')) {
        console.error(`[SpineRenderer] WebGL shader 错误（上下文可能丢失）:`, e.message);
        // 不清空 spineComponents，保留给上下文恢复时 restore 使用
        this._contextLost = true;
        this.stop();
        this._startContextRecoveryPolling();
        return;
      }
      console.error(`[SpineRenderer] ★★★ _renderNode 异常:`, e?.message || e, '\n', e?.stack);
    }
  }


  // 渲染 ImageNode（静态图片纹理四边形）
  _renderImageNode(node, gl) {
    try {
      if (!node._image || !node._image.complete || !node._image.naturalWidth) {
        if (!node._imgLogOnce) { node._imgLogOnce = true; console.warn('[ImageNode] 图片未就绪，跳过渲染'); }
        return;
      }
      if (!node._imgLogOnce) {
        node._imgLogOnce = true;
        console.log(`[ImageNode] 首次渲染: src=${typeof node.src === 'string' ? node.src : 'Image'}, size=${node._naturalWidth}x${node._naturalHeight}, renderX=${node.renderX.toFixed(1)}, renderY=${node.renderY.toFixed(1)}, renderScale=${node.renderScale.toFixed(4)}, opacity=${node.renderOpacity.toFixed(3)}, visible=${node.visible}, _clippedOut=${node._clippedOut}, clip=${JSON.stringify(node.renderClip)}, maskType=${node.renderMaskType}`);
      }

      // 每200帧打印一次状态（诊断白色问题）
      node._imgDiagFrame = (node._imgDiagFrame || 0) + 1;
      if (node._imgDiagFrame % 200 === 1) {
        // console.log(`[ImageNode] 诊断帧#${node._imgDiagFrame}: visible=${node.visible}, _clippedOut=${node._clippedOut}, opacity=${node.renderOpacity.toFixed(3)}, renderClip=${JSON.stringify(node.renderClip)}, maskType=${node.renderMaskType}, stencilActive=${node._stencilActive}, textureReady=${node._textureReady}, _textureExists=${!!this._imageTextures.get(node._image)}`);
      }

      // 获取或创建 WebGL 纹理
      let texture = this._imageTextures.get(node._image);
      if (!texture) {
        texture = gl.createTexture();
        this._imageTextures.set(node._image, texture);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      if (!node._textureReady) {
        // 用 canvas 中转确保 texImage2D 可靠上传
        const cv = document.createElement('canvas');
        cv.width = node._naturalWidth;
        cv.height = node._naturalHeight;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(node._image, 0, 0);
        // 验证像素
        const px = ctx.getImageData(Math.floor(cv.width / 2), Math.floor(cv.height / 2), 1, 1).data;
        // console.log(`[ImageNode] 纹理上传: canvas ${cv.width}x${cv.height}, 中心像素=[${px[0]},${px[1]},${px[2]},${px[3]}]`);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        node._textureReady = true;
      }

      // 遮罩：使用 stencil 做形状裁切（圆角矩形等），stencil 区域由 _applyStencilMask 写入
      // _applyStencilMask 内部会同时设置 scissor，所以不需要单独设置 scissor
      const useStencil = node.renderMaskType && node.renderMaskType !== 'rect';
      if (useStencil) {
        this._applyStencilMask(gl, node);
        // _applyStencilMask 内部的 _drawMaskTextureToStencil 会把遮罩纹理绑定到 TEXTURE0
        // 必须重新绑定图片纹理，否则 shader 采样到的是遮罩纹理（白色）而非背景图
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
      } else if (node.renderClip) {
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(node.renderClip.x, node.renderClip.y, node.renderClip.width, node.renderClip.height);
      }

      // 创建/获取 shader program
      if (!this._imageProgram) {
        this._imageProgram = this._createImageShaderProgram(gl);
        if (this._imageProgram) {
          // 缓存 uniform 和 attribute location
          this._imageLoc = {
            mvp: gl.getUniformLocation(this._imageProgram, 'u_mvpMatrix'),
            tex: gl.getUniformLocation(this._imageProgram, 'u_texture'),
            opacity: gl.getUniformLocation(this._imageProgram, 'u_opacity'),
            pos: gl.getAttribLocation(this._imageProgram, 'a_position'),
            uv: gl.getAttribLocation(this._imageProgram, 'a_texCoord'),
          };
          // console.log('[ImageNode] shader locations:', JSON.stringify(this._imageLoc));
        }
      }

      if (!this._imageProgram || !this._imageLoc) {
        console.error('[ImageNode] shader program 未创建成功');
        // 恢复遮罩
        if (useStencil) { if (node._stencilActive) { this._clearStencilMask(gl); node._stencilActive = false; } else { gl.disable(gl.SCISSOR_TEST); } }
        else if (node.renderClip) { gl.disable(gl.SCISSOR_TEST); }
        return;
      }

      // 构建 MVP 矩阵（手写，不依赖 spine Matrix4）
      // renderX/renderY 是图片中心点在设备像素坐标（Y向上，由 _updateNodeRenderParams 计算）
      // halfW/halfH 是图片半宽/半高在设备像素坐标
      const s = node.renderScale;
      const cW = this.canvas.width;
      const cH = this.canvas.height;
      const halfW = node._renderImageWidth ? node._renderImageWidth / 2 : (node._naturalWidth / 2) * s;
      const halfH = node._renderImageHeight ? node._renderImageHeight / 2 : (node._naturalHeight / 2) * s;
      const cx = node.renderX;   // 中心 X（设备像素）
      const cy = node.renderY;   // 中心 Y（WebGL Y向上，设备像素）
      // 正交投影: pixel → NDC [-1,1]
      // ndcX = 2 * pixelX / cW - 1
      // ndcY = 2 * pixelY / cH - 1
      // 中心 NDC: (2*cx/cW - 1, 2*cy/cH - 1)
      // 半宽 NDC: halfW/(cW/2) = 2*halfW/cW
      const mvp = this._imageMVPBuffer || (this._imageMVPBuffer = new Float32Array(16));
      // 列主序:
      mvp.fill(0);
      mvp[0] = 2 * halfW / cW;            // Scale X
      mvp[5] = 2 * halfH / cH;            // Scale Y
      mvp[10] = 1;
      mvp[15] = 1;
      mvp[12] = 2 * cx / cW - 1;          // Translate X (中心 NDC)
      mvp[13] = 2 * cy / cH - 1;          // Translate Y (中心 NDC)

      if (!node._imgMvpLogOnce) {
        node._imgMvpLogOnce = true;
        console.log(`[ImageNode-MVP] center=(${cx.toFixed(1)},${cy.toFixed(1)}), halfSize=(${halfW.toFixed(1)},${halfH.toFixed(1)}), scale=(${mvp[0].toFixed(4)},${mvp[5].toFixed(4)}), translate=(${mvp[12].toFixed(4)},${mvp[13].toFixed(4)}), canvas=${cW}x${cH}, imgNatural=${node._naturalWidth}x${node._naturalHeight}, _rw=${node._renderImageWidth}, _rh=${node._renderImageHeight}`);
      }

      // 单位四边形顶点（NDC空间，shader通过MVP映射到正确位置）
      const vertices = new Float32Array([
        -1, -1, 0, 0,
        1, -1, 1, 0,
        -1, 1, 0, 1,
        1, 1, 1, 1,
      ]);

      if (!this._imageQuadBuffer) {
        this._imageQuadBuffer = gl.createBuffer();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this._imageQuadBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

      gl.useProgram(this._imageProgram);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.uniformMatrix4fv(this._imageLoc.mvp, false, mvp);
      gl.uniform1i(this._imageLoc.tex, 0);
      gl.uniform1f(this._imageLoc.opacity, node.renderOpacity);

      gl.enableVertexAttribArray(this._imageLoc.pos);
      gl.vertexAttribPointer(this._imageLoc.pos, 2, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(this._imageLoc.uv);
      gl.vertexAttribPointer(this._imageLoc.uv, 2, gl.FLOAT, false, 16, 8);
      // 清除渲染前可能残留的 GL 错误（来自其他节点如 spine 的渲染）
      while (gl.getError() !== gl.NO_ERROR) { }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const glErr = gl.getError();
      if (glErr) {
        console.warn(`[ImageNode] gl.getError() after drawArrays: ${glErr}`, node.src);
      }
      gl.disableVertexAttribArray(this._imageLoc.pos);
      gl.disableVertexAttribArray(this._imageLoc.uv);

      // 恢复遮罩
      if (useStencil) {
        if (node._stencilActive) {
          this._clearStencilMask(gl);
          node._stencilActive = false;
        } else {
          gl.disable(gl.SCISSOR_TEST);
        }
      } else if (node.renderClip) {
        gl.disable(gl.SCISSOR_TEST);
      }
    } catch (e) {
      console.error('[SpineRenderer] ★★★ _renderImageNode 异常:', e?.message || e, '\n', e?.stack);
    }
  }




  // 创建图片渲染 shader（MVP + texture + opacity）
  _createImageShaderProgram(gl) {
    const vs = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform mat4 u_mvpMatrix;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_texCoord;
        gl_Position = u_mvpMatrix * vec4(a_position, 0.0, 1.0);
      }
    `;
    const fs = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      uniform float u_opacity;
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        gl_FragColor = vec4(color.rgb, color.a * u_opacity);
      }
    `;
    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      if (!shader) {
        console.error('[SpineRenderer] gl.createShader 返回 null，WebGL 上下文可能已丢失');
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('[SpineRenderer] Image shader编译失败:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vsShader = compileShader(gl.VERTEX_SHADER, vs);
    const fsShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vsShader || !fsShader) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vsShader);
    gl.attachShader(program, fsShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[SpineRenderer] Image program链接失败:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  // 启动渲染循环
  start() {
    if (this.running) return;
    this.running = true;
    this.requestId = requestAnimationFrame(this.render.bind(this));
  }

  // 停止渲染循环
  stop() {
    this.running = false;
    if (this.requestId !== undefined) {
      cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
    if (this._recoveryPollingId) {
      clearInterval(this._recoveryPollingId);
      this._recoveryPollingId = null;
    }
  }

  /**
   * 上下文丢失后启动恢复轮询
   * 当浏览器没有触发 webglcontextrestored 事件时（如上下文被永久回收），
   * 通过轮询检测上下文是否可用，尝试重新初始化
   */
  _startContextRecoveryPolling() {
    if (this._recoveryPollingId) return; // 已在轮询
    console.warn('[SpineRenderer] 启动上下文恢复轮询...');
    let attempts = 0;
    this._recoveryPollingId = setInterval(() => {
      attempts++;
      if (!this.gl || !this._contextLost) {
        // 已恢复或标记已清除
        clearInterval(this._recoveryPollingId);
        this._recoveryPollingId = null;
        return;
      }
      // 检查上下文是否可用（某些浏览器不会自动触发 webglcontextrestored）
      try {
        if (!this.gl.isContextLost()) {
          console.warn('[SpineRenderer] 上下文已恢复（轮询检测）');
          clearInterval(this._recoveryPollingId);
          this._recoveryPollingId = null;
          // 手动触发恢复流程
          this._contextRestoredHandler();
          return;
        }
      } catch (e) {
        // isContextLost() 可能抛异常
      }
      // 超过30次（约30秒）：尝试在同一个 canvas 上重新获取 WebGL 上下文
      if (attempts === 30) {
        console.warn('[SpineRenderer] 上下文恢复超时，尝试重建 WebGL 上下文...');
        try {
          // 先释放旧上下文引用
          this.gl = null;
          // 在同一个 canvas 上重新获取 WebGL 上下文
          this._initWebGL();
          if (this.gl && !this.gl.isContextLost()) {
            console.warn('[SpineRenderer] WebGL 上下文重建成功，重建所有 GL 资源...');
            clearInterval(this._recoveryPollingId);
            this._recoveryPollingId = null;
            // 重建所有版本组件的 GL 资源（shader、buffer、纹理等）
            this._rebuildSpineComponents();
            // 重建自定义图片渲染资源
            this._imageTextures.clear();
            this._imageProgram = null;
            this._imageLoc = null;
            this._imageQuadBuffer = null;
            this.resized = false;
            // 重新启动渲染循环
            this._contextLost = false;
            this.start();
            // 派发事件通知 Pack 重新加载所有 spine
            window.dispatchEvent(new CustomEvent('tl-spine-context-rebuilt'));
            return;
          }
          console.error('[SpineRenderer] WebGL 上下文重建失败');
        } catch (e) {
          console.error('[SpineRenderer] WebGL 上下文重建异常:', e);
        }
      }
      // 超过60次（约60秒）放弃
      if (attempts > 60) {
        console.error('[SpineRenderer] 上下文恢复轮询超时，放弃恢复');
        clearInterval(this._recoveryPollingId);
        this._recoveryPollingId = null;
      }
    }, 1000);
  }

  // 获取 Spine 可用动作列表
  getSpineActions(node) {
    if (!node.skeleton || !node.skeleton.data) return [];
    return node.skeleton.data.animations.map(a => ({ name: a.name, duration: a.duration }));
  }

  // 检查容器及其父链是否全部可见
  _isContainerVisible(container) {
    let current = container;
    while (current) {
      if (!current.visible) return false;
      current = current.parentContainer;
    }
    return true;
  }

  // 计算容器链的世界累积变换（帧级缓存）
  _computeContainerWorldTransform(container, frameId) {
    // 先确保所有父容器的变换已计算
    if (container.parentContainer && container.parentContainer._worldTransformFrame !== frameId) {
      this._computeContainerWorldTransform(container.parentContainer, frameId);
    }
    const parent = container.parentContainer;
    const pAccumX = parent ? parent._worldAccumX : 0;
    const pAccumY = parent ? parent._worldAccumY : 0;
    const pScaleX = parent ? parent._worldAccumScaleX : 1;
    const pScaleY = parent ? parent._worldAccumScaleY : 1;

    const pAccumAlpha = parent ? parent._worldAccumAlpha : 1;
    container._worldAccumX = (container.x ?? 0) * pScaleX + pAccumX +
      (container._anchorOffsetX || 0) * pScaleX;
    container._worldAccumY = (container.y ?? 0) * pScaleY + pAccumY +
      (container._anchorOffsetY || 0) * pScaleY;
    container._worldAccumScaleX = (container.scaleX ?? 1) * pScaleX;
    container._worldAccumScaleY = (container.scaleY ?? 1) * pScaleY;
    container._worldAccumAlpha = (container.alpha ?? 1) * pAccumAlpha;
    container._worldTransformFrame = frameId;
  }

  // 收集容器链上所有遮罩（从内到外），用于求交集
  _collectContainerMasks(container) {
    const masks = [];
    let current = container;
    while (current) {
      if (current.mask) masks.push({ mask: current.mask, container: current });
      current = current.parentContainer;
    }
    return masks;
  }

  // 应用 stencil 遮罩（lutou/roundRect/svg 等复杂形状）
  _applyStencilMask(gl, node) {
    const maskConfig = node.renderMaskConfig;
    if (!maskConfig) return;

    // 先用 scissor 限制绘制区域（优化性能）
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(node.renderClip.x, node.renderClip.y, node.renderClip.width, node.renderClip.height);

    gl.enable(gl.STENCIL_TEST);
    gl.clearStencil(0);
    gl.clear(gl.STENCIL_BUFFER_BIT);

    // 第一步：写入 stencil（只写入 stencil buffer，不写 color buffer）
    gl.colorMask(false, false, false, false);
    gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.stencilMask(0xFF);

    // 使用 Canvas2D 渲染遮罩路径，然后作为纹理绘制到 stencil
    const maskCanvas = this._renderMaskToCanvas(maskConfig, node.renderClip.width, node.renderClip.height);
    if (maskCanvas) {
      this._drawMaskTextureToStencil(gl, maskCanvas, node);
    } else {
      // 降级为纯 scissor（不使用 stencil）
      gl.disable(gl.STENCIL_TEST);
      gl.colorMask(true, true, true, true);
      // scissor 已经设置好了，保持不变
      node._stencilActive = false;
      return;
    }

    // 第二步：恢复 color buffer 写入，只渲染 stencil=1 的区域
    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.EQUAL, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilMask(0x00);

    // 保持 scissor 限制在遮罩区域内（进一步优化）
    node._stencilActive = true;
  }

  // 清除 stencil 遮罩
  _clearStencilMask(gl) {
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.stencilMask(0xFF);
  }

  // 将遮罩配置渲染到 Canvas2D
  // width/height 是 scissor 区域的物理像素尺寸
  _renderMaskToCanvas(maskConfig, width, height) {
    // 宽高为0或取整后为0时直接返回null，降级为scissor
    if (!width || !height || Math.round(width) < 1 || Math.round(height) < 1) return null;
    // 检查缓存
    const cacheKey = `${maskConfig.type}_${width}_${height}_${JSON.stringify(maskConfig)}`;
    if (this._maskCanvasCache?.key === cacheKey) {
      return this._maskCanvasCache.canvas;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 使用帧级缓存
    const effectiveDpr = this._frameEffectiveDpr || (this.dpr / (parseFloat(window.getComputedStyle(document.body).zoom) || 1));

    // 容器累积缩放（由 _updateNodeRenderParams 中的遮罩计算设置）
    const containerScaleX = maskConfig._containerScaleX ?? 1;
    const containerScaleY = maskConfig._containerScaleY ?? 1;

    // 遮罩路径的坐标是CSS像素，需要缩放到物理像素
    // 多层 mask 交集时，scissor 区域可能只包含遮罩的一部分
    // stencilOffsetX/Y = 交集左上角相对于遮罩局部原点的CSS偏移（已除以容器缩放）
    // 路径点 (maskX + stencilOffsetX, maskY + stencilOffsetY) 应映射到 canvas (0, 0)
    // 推导：ctx.translate(-offsetX, -offsetY) 在 scale 之前，等效于最终坐标 = point*scale + translate
    // 要使 (maskX+sOX)*dpr*sX + tx = 0 → tx = -(maskX+sOX)*dpr*sX → offsetX = (maskX+sOX)*dpr*sX
    const stencilOffsetX = maskConfig._stencilOffsetX ?? 0;
    const stencilOffsetY = maskConfig._stencilOffsetY ?? 0;
    const offsetX = ((maskConfig.x ?? 0) + stencilOffsetX) * effectiveDpr * containerScaleX;
    const offsetY = ((maskConfig.y ?? 0) + stencilOffsetY) * effectiveDpr * containerScaleY;

    // Canvas2D 的坐标系原点在左上角
    // 遮罩路径需要偏移到 scissor 区域的左上角
    // 路径使用容器局部坐标系（未缩放），通过 ctx.scale 应用缩放
    ctx.save();
    ctx.translate(-offsetX, -offsetY);
    ctx.scale(effectiveDpr * containerScaleX, effectiveDpr * containerScaleY);

    const path = this._buildMaskPath(maskConfig,
      (maskConfig.width ?? width / effectiveDpr),
      (maskConfig.height ?? height / effectiveDpr));
    if (!path) {
      console.warn(`[MASK-CANVAS] _buildMaskPath returned null for type=${maskConfig.type}`);
      ctx.restore();
      return null;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fill(path);
    ctx.restore();

    // 缓存
    this._maskCanvasCache = { key: cacheKey, canvas };
    return canvas;
  }

  // 构建 Path2D
  _buildMaskPath(maskConfig, width, height) {
    const path = new Path2D();
    const m = maskConfig;

    if (m.type === 'rect') {
      path.rect(m.x ?? 0, m.y ?? 0, m.width ?? width, m.height ?? height);
    } else if (m.type === 'roundRect') {
      const r = m.radius ?? Math.min(width, height) * 0.05;
      path.roundRect(m.x ?? 0, m.y ?? 0, m.width ?? width, m.height ?? height, r);
    } else if (m.type === 'lutou') {
      const lutouPath = new Path2D();
      this._drawLutouPath(lutouPath, m.width ?? width, m.height ?? height, m.isBg, m.style);
      const transform = new DOMMatrix();
      transform.translateSelf(m.x ?? 0, m.y ?? 0);
      path.addPath(lutouPath, transform);
    } else if (m.type === 'svg') {
      const pathData = m.path.replace(/(\d)([a-zA-Z])/g, '$1 $2').replace(/([a-zA-Z])(\d)/g, '$1 $2');
      const svgPath = new Path2D(pathData);
      const transform = new DOMMatrix();
      transform.translateSelf(m.x ?? 0, m.y ?? 0);
      transform.scaleSelf(width, height);
      path.addPath(svgPath, transform);
    } else {
      return null;
    }

    return path;
  }

  // 绘制露头路径
  _drawLutouPath(path, w, h, isBg = false, style = 'on') {
    SpineMask._drawLutouPath(path, w, h, isBg, style);
  }

  // 将遮罩纹理绘制到 stencil buffer
  _drawMaskTextureToStencil(gl, maskCanvas, node) {
    const clip = node.renderClip;
    if (!clip) return;

    // 诊断日志
    if (!maskCanvas || maskCanvas.width === 0 || maskCanvas.height === 0) {
      console.warn(`[MASK-CANVAS] texImage2D 无效: maskCanvas=${!!maskCanvas}, w=${maskCanvas?.width}, h=${maskCanvas?.height}, maskType=${node.renderMaskType}`);
      return;
    }

    // 创建/更新遮罩纹理
    if (!this._maskTexture) {
      this._maskTexture = gl.createTexture();
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._maskTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskCanvas);

    // 初始化遮罩专用的 shader
    if (!this._maskProgram) {
      this._maskProgram = this._createMaskShaderProgram(gl);
    }

    // 将 scissor 区域映射为 NDC 坐标，只在这个区域绘制遮罩纹理
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    // clip 是物理像素坐标，Y 轴原点在左下角（WebGL 坐标系）
    const ndcLeft = (clip.x / cw) * 2 - 1;
    const ndcRight = ((clip.x + clip.width) / cw) * 2 - 1;
    const ndcBottom = (clip.y / ch) * 2 - 1;
    const ndcTop = ((clip.y + clip.height) / ch) * 2 - 1;

    // 创建覆盖 scissor 区域的四边形，UV 映射 0-1
    const vertices = new Float32Array([
      ndcLeft, ndcBottom, 0, 0,
      ndcRight, ndcBottom, 1, 0,
      ndcLeft, ndcTop, 0, 1,
      ndcRight, ndcTop, 1, 1,
    ]);

    if (!this._maskQuadBuffer) {
      this._maskQuadBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._maskQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    const program = this._maskProgram;
    gl.useProgram(program);

    // 设置纹理
    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

    // 绘制四边形
    const posLoc = gl.getAttribLocation(program, 'a_position');
    const uvLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disableVertexAttribArray(posLoc);
    gl.disableVertexAttribArray(uvLoc);

    // 恢复 UNPACK_FLIP_Y，避免影响后续纹理上传
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  // 创建遮罩用的 shader program
  _createMaskShaderProgram(gl) {
    const vs = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_texCoord;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fs = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      void main() {
        vec4 color = texture2D(u_texture, v_texCoord);
        if (color.a < 0.5) discard;
        gl_FragColor = vec4(1.0);
      }
    `;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('[SpineRenderer] Shader编译失败:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vsShader = compileShader(gl.VERTEX_SHADER, vs);
    const fsShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vsShader || !fsShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vsShader);
    gl.attachShader(program, fsShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[SpineRenderer] Program链接失败:', gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  // 创建全屏四边形（NDC 坐标 -1 到 1）
  _createFullscreenQuad(gl, width, height) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // NDC坐标 (x,y) + UV (u,v)
    const vertices = new Float32Array([
      -1, -1, 0, 0,
      1, -1, 1, 0,
      -1, 1, 0, 1,
      1, 1, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return buffer;
  }

  // 销毁渲染器
  destroy() {
    this.stop();
    window.removeEventListener('resize', this._resizeHandler);
    this.canvas.removeEventListener('webglcontextlost', this._contextLostHandler);
    this.canvas.removeEventListener('webglcontextrestored', this._contextRestoredHandler);
    for (const container of this.containers) {
      container.destroy();
    }
    this.containers = [];
    // 释放所有版本的 spine GPU 纹理
    for (const [version, components] of Object.entries(this.spineComponents)) {
      if (components.assetManager) {
        const am = components.assetManager;
        for (const [path, asset] of Object.entries(am.assets)) {
          if (asset && typeof asset.dispose === 'function') {
            try { asset.dispose(); } catch (e) {}
          }
        }
        am.assets = {};
        if (am.assetsRefCount) am.assetsRefCount = {};
        if (am.assetsLoaded) am.assetsLoaded = {};
      }
    }
    this.spineComponents = {};
    this._pendingComponents = {};
    // 释放 ImageNode GPU 纹理
    if (this.gl && !this.gl.isContextLost()) {
      for (const tex of this._imageTextures.values()) {
        try { this.gl.deleteTexture(tex); } catch (e) {}
      }
    }
    this.gl = null;
    this.loadedAssets = {};
    this._assetRefCount = {};
    this._assetLoadOrder = [];
    this._pendingAssets.clear();
    this._pendingAssetsTime.clear();
    this._maskCanvasCache = null;
    this._maskProgram = null;
    this._maskQuadBuffer = null;
    this._maskTexture = null;
    this._imageProgram = null;
    this._imageLoc = null;
    this._imageQuadBuffer = null;
    this._imageMVPBuffer = null;
    this._imageTextures.clear();
    this._tmpRotMat = null;
    this._tmpScaleMat = null;
    this.bindShader = undefined;
  }
}

export { SpineRenderer, SpineContainer, SpineNode, ImageNode };
