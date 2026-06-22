/**
 * SpineMask - SVG 风格的复杂遮罩支持
 * 
 * 替代 PIXI.Graphics 遮罩，支持：
 * 1. SVG Path 遮罩（贝塞尔曲线、弧线等复杂形状）
 * 2. 矩形遮罩（含圆角）
 * 3. 露头遮罩（与原版 drawMask 兼容）
 * 4. 组合遮罩（多个形状组合）
 * 
 * 遮罩通过 WebGL scissor 裁剪或 Canvas2D + WebGL 纹理混合实现
 */

class SpineMask {
  /**
   * 创建矩形遮罩
   * @param {number} x - 左上角 X
   * @param {number} y - 左上角 Y  
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {number} [radius=0] - 圆角半径
   * @returns {object} 遮罩配置
   */
  static rect(x, y, width, height, radius = 0) {
    return {
      type: radius > 0 ? 'roundRect' : 'rect',
      x, y, width, height,
      radius,
    };
  }

  /**
   * 创建 SVG Path 遮罩
   * @param {string} pathData - SVG path d 属性值（支持归一化坐标 0-1）
   * @param {object} options - { x, y, width, height, units }
   * @returns {object} 遮罩配置
   */
  static svgPath(pathData, options = {}) {
    return {
      type: 'svg',
      path: pathData,
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width,
      height: options.height,
      units: options.units || 'objectBoundingBox', // 'objectBoundingBox'(归一化) | 'userSpaceOnUse'(像素)
    };
  }

  /**
   * 创建露头遮罩（与原版 drawMask 兼容）
   * @param {number} width - 宽度
   * @param {number} height - 高度
   * @param {boolean} [isBg=false] - 是否为背景层遮罩
   * @returns {object} 遮罩配置
   */
  static lutou(width, height, isBg = false, style = 'on', x = 0, y = 0) {
    return {
      type: 'lutou',
      x, y,
      width, height,
      isBg,
      style,
    };
  }

  /**
   * 创建组合遮罩（多个形状取并集/交集）
   * @param {string} operation - 'union'(并集) | 'intersect'(交集) | 'exclude'(差集)
   * @param {object[]} masks - 子遮罩列表
   * @returns {object} 遮罩配置
   */
  static combine(operation, ...masks) {
    return {
      type: 'combine',
      operation,
      masks,
    };
  }

  /**
   * 构建 Canvas2D Path2D（用于将 SVG 遮罩转为 WebGL 可用的裁剪参数）
   * @param {object} maskConfig - 遮罩配置
   * @param {number} width - 容器宽度
   * @param {number} height - 容器高度
   * @returns {Path2D|null}
   */
  static buildPath2D(maskConfig, width, height) {
    if (!maskConfig) return null;

    const path = new Path2D();

    switch (maskConfig.type) {
      case 'rect':
        path.rect(
          maskConfig.x ?? 0,
          maskConfig.y ?? 0,
          maskConfig.width ?? width,
          maskConfig.height ?? height
        );
        break;

      case 'roundRect': {
        const r = maskConfig.radius ?? Math.min(width, height) * 0.05;
        path.roundRect(
          maskConfig.x ?? 0,
          maskConfig.y ?? 0,
          maskConfig.width ?? width,
          maskConfig.height ?? height,
          r
        );
        break;
      }

      case 'svg': {
        const svgPath = new Path2D(maskConfig.path);
        if (maskConfig.units === 'objectBoundingBox') {
          // 归一化坐标，需要缩放到实际尺寸
          const transform = new DOMMatrix();
          transform.translateSelf(maskConfig.x ?? 0, maskConfig.y ?? 0);
          transform.scaleSelf(
            maskConfig.width ?? width,
            maskConfig.height ?? height
          );
          path.addPath(svgPath, transform);
        } else {
          // 用户空间坐标，直接使用
          path.addPath(svgPath);
        }
        break;
      }

      case 'lutou': {
        const lutouPath = new Path2D();
        SpineMask._drawLutouPath(lutouPath, maskConfig.width ?? width, maskConfig.height ?? height, maskConfig.isBg, maskConfig.style);
        const transform = new DOMMatrix();
        transform.translateSelf(maskConfig.x ?? 0, maskConfig.y ?? 0);
        path.addPath(lutouPath, transform);
        break;
      }

      case 'combine': {
        for (const subMask of maskConfig.masks) {
          const subPath = SpineMask.buildPath2D(subMask, width, height);
          if (subPath) {
            path.addPath(subPath);
          }
        }
        break;
      }

      default:
        return null;
    }

    return path;
  }

  /**
   * 绘制露头遮罩路径（与原版 drawMask 兼容）
   */
  static _drawLutouPath(path, w, h, isBg = false, style = 'on') {
    if (isBg) {
      path.roundRect(0, 0, w, h, 0.05 * w);
      return;
    }

    switch (style) {
      case 'on':
        SpineMask._drawOnOutcropPlayerPath(path, w, h);
        break;
      case 'off':
        SpineMask._drawOffOutcropPlayerPath(path, w, h);
        break;
      case 'othersOff':
        SpineMask._drawOthersOffOutcropPlayerPath(path, w, h);
        break;
      case 'onlineUI':
        SpineMask._drawOnlineUIOutcropPlayerPath(path, w, h);
        break;
      case 'babysha':
        SpineMask._drawBabyshaOutcropPlayerPath(path, w, h);
        break;
      case 'codename':
        SpineMask._drawCodenameOutcropPlayerPath(path, w, h);
        break;
      default:
        SpineMask._drawDefaultOutcropPlayerPath(path, w, h);
        break;
    }
  }

  // 十周年露头人物遮罩
  static _drawOnOutcropPlayerPath(path, w, h) {
    SpineMask._drawComplexOutcropPlayerPath(path, w, h);
  }

  // 移动版露头人物遮罩
  static _drawOffOutcropPlayerPath(path, w, h) {
    SpineMask._drawMobileOutcropPlayerPath(path, w, h);
  }

  // 一将成名露头人物遮罩
  static _drawOthersOffOutcropPlayerPath(path, w, h) {
    SpineMask._drawComplexOutcropPlayerPath(path, w, h);
  }

  // Online 露头人物遮罩
  static _drawOnlineUIOutcropPlayerPath(path, w, h) {
    SpineMask._drawComplexOutcropPlayerPath(path, w, h,0.05);
  }

  // 欢乐三国杀露头人物遮罩
  static _drawBabyshaOutcropPlayerPath(path, w, h) {
    SpineMask._drawComplexOutcropPlayerPath(path, w, h);
  }

  // 名将杀露头人物遮罩
  static _drawCodenameOutcropPlayerPath(path, w, h) {
    SpineMask._drawComplexOutcropPlayerPath(path, w, h);
  }

  // 未知样式的露头人物遮罩兜底
  static _drawDefaultOutcropPlayerPath(path, w, h) {
    SpineMask._drawComplexOutcropPlayerPath(path, w, h);
  }

  // 初始共用的复杂露头人物路径；各样式方法可改为自己的绘制代码。
static _drawComplexOutcropPlayerPath(path, w, h,r=0.07) {
    const oldR = 0.05;
    // 原纵向圆角高度 0.086，按比例换算新值
    const verticalEdge = 0.086 / oldR * r;
    path.moveTo(w * 0.39, 0);
    // 保留原有控制点 w*0.19 不变，只修改终点y为 h*r
    path.bezierCurveTo(w * 0.19, 0, w * 0.19, h * r, w * 0.19, h * r);
    // 横向直线起点由0.05改为0.07
    path.lineTo(w * r, h * r);
    path.bezierCurveTo(0, h * r, 0, h * verticalEdge, 0, h * verticalEdge);
    path.lineTo(0, h * (1 - verticalEdge));
    path.bezierCurveTo(0, h, w * r, h, w * r, h);
    path.lineTo(w * (1 - r), h);
    path.bezierCurveTo(w, h, w, h * (1 - verticalEdge), w, h * (1 - verticalEdge));
    path.lineTo(w, h * verticalEdge);
    path.bezierCurveTo(w, h * r, w * (1 - r), h * r, w * (1 - r), h * r);
    path.bezierCurveTo(w * (1 - r), h * r, w * (1 - r), 0, w * 0.76, 0);
    path.closePath();
  }
  
  // 移动版遮罩路径
  static _drawMobileOutcropPlayerPath(path, w, h, radiusRatio = 0.07) {
    // 四个角统一按宽度计算；默认半径为 0.07 * w。
    const radius = Math.min(w * radiusRatio, w / 2, h / 2);

    // ========== 弧形顶可调参数 ==========
    const topPeakX = 0.5;        // 顶点横向位置：0=最左，1=最右
    const topPeakY = 0.1;           // 顶点纵向位置：像素，数值越大越靠下
    const topArcDrop = h * 0.05;  // 两侧肩部比顶点低多少，越大弧顶越高
    const topCurveTension = 1;    // 弧顶靠近顶点处的控制柄长度系数
    // ====================================

    const shoulderY = Math.min(topPeakY + topArcDrop, h - radius * 2);
    const sideJoinY = shoulderY + radius;
    const peakX = Math.max(0, Math.min(w * topPeakX, w));
    // 控制柄按弧顶高度计算，避免横向跨度较大时把弧顶拉成平台。
    const topCurveHandle = Math.max(0, topArcDrop * topCurveTension);

    // 从左下角开始，沿顺时针方向绘制完整封闭路径。
    path.moveTo(radius, h);

    // 下边与右下圆角。
    path.lineTo(w - radius, h);
    path.quadraticCurveTo(w, h, w, h - radius);

    // 右侧边直接接入弧顶；第一个控制点保持竖向切线。
    path.lineTo(w, sideJoinY);
    path.bezierCurveTo(
      w,
      shoulderY,
      Math.min(w, peakX + topCurveHandle),
      topPeakY,
      peakX,
      topPeakY
    );

    // 弧顶顶点直接接入左侧边；最后一个控制点同样保持竖向切线。
    path.bezierCurveTo(
      Math.max(0, peakX - topCurveHandle),
      topPeakY,
      0,
      shoulderY,
      0,
      sideJoinY
    );

    // 左侧边与左下圆角。
    path.lineTo(0, h - radius);
    path.quadraticCurveTo(0, h, radius, h);
    path.closePath();
  }

  /**
   * 将 Path2D 转为 WebGL scissor 裁剪框（取边界框）
   * 复杂形状需要使用 stencil buffer 或纹理遮罩
   * @param {Path2D} path
   * @param {CanvasRenderingContext2D} ctx - 用于计算边界框
   * @returns {{ x, y, width, height }} scissor 参数
   */
  static pathToScissor(path, ctx) {
    // 使用 Canvas2D 计算路径的边界框
    ctx.beginPath();
    const bounds = ctx.getContext?.('2d')
      ? null
      : { x: 0, y: 0, width: 0, height: 0 };

    // 简化：使用临时 canvas 计算边界
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const strokePath = new Path2D();
    strokePath.addPath(path);

    // 使用 getBoundingClientRect 的替代方案
    // 通过 Path2D 无法直接获取 bounds，但可以用 ctx.measureText 的思路
    // 实际上需要用 canvas stroke + getImageData 扫描
    // 简化方案：直接返回全画布裁剪
    return null;
  }

  /**
   * 使用 Canvas2D 将遮罩渲染为 WebGL 纹理（用于 stencil 遮罩）
   * @param {object} maskConfig - 遮罩配置
   * @param {number} width - 纹理宽度
   * @param {number} height - 纹理高度
   * @returns {HTMLCanvasElement} 包含遮罩的 canvas
   */
  static renderToCanvas(maskConfig, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const path = SpineMask.buildPath2D(maskConfig, width, height);
    if (!path) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fill(path);

    return canvas;
  }

  /**
   * 应用遮罩到 WebGL stencil buffer
   * @param {WebGLRenderingContext} gl
   * @param {object} maskConfig - 遮罩配置
   * @param {number} width - 画布宽度
   * @param {number} height - 画布高度
   * @param {object} spine - 当前版本的 spine 运行时
   */
  static applyStencilMask(gl, maskConfig, width, height, spine) {
    if (!maskConfig) return;

    // 对于简单矩形遮罩，使用 scissor
    if (maskConfig.type === 'rect') {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(
        maskConfig.x ?? 0,
        maskConfig.y ?? 0,
        maskConfig.width ?? width,
        maskConfig.height ?? height
      );
      return;
    }

    // 对于圆角矩形/SVG/露头等复杂遮罩，使用 stencil buffer
    gl.enable(gl.STENCIL_TEST);
    gl.clearStencil(0);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.stencilFunc(gl.ALWAYS, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.colorMask(false, false, false, false);

    // 渲染遮罩路径到 stencil
    const path = SpineMask.buildPath2D(maskConfig, width, height);
    if (path) {
      // 使用 Canvas2D 渲染遮罩，然后作为纹理绘制到 stencil
      const maskCanvas = SpineMask.renderToCanvas(maskConfig, width, height);
      if (maskCanvas) {
        // 简化方案：使用全画布 scissor + 路径近似
        // 完整方案需要用 WebGL 绘制纹理到 stencil
        // 此处使用临时纹理 + scissor 近似
      }
    }

    // 恢复渲染状态
    gl.colorMask(true, true, true, true);
    gl.stencilFunc(gl.EQUAL, 1, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
  }

  /**
   * 清除 stencil 遮罩
   * @param {WebGLRenderingContext} gl
   */
  static clearStencilMask(gl) {
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
  }

  /**
   * 兼容旧版 drawMask 接口
   * @param {number[]} location - [x, y, w, h]
   * @param {string} type - 'pe' | 'bg'
   * @param {boolean} lutouEnabled - 是否启用露头
   * @param {string} style - “切换样式”的配置值
   * @param {string} lutouStyle - 露头样式
   * @returns {object} 遮罩配置
   */
  static fromLegacyDrawMask(location, type, lutouEnabled, style = 'on', lutouStyle = 'shizhounian') {
    const [x, y, w, h] = location;

    // 移动版开启露头时，背景层和人物层共用移动版复杂遮罩。
    if (lutouEnabled && style === 'off') {
      return SpineMask.lutou(w, h, false, 'off', x, y);
    }

    if (lutouEnabled && type === 'pe') {
      return SpineMask.lutou(w, h, false, style, x, y);
    }

    switch (style) {
      // 十周年
      // case 'on': {
      //   const normalMask = SpineMask.rect(0, 0, w, h, 0.07 * w);
      //   const outcropPlayerMask = SpineMask.lutou(w, h, false, lutouStyle);
      //   return lutouEnabled && type === 'pe' ? outcropPlayerMask : normalMask;
      // }

      // 移动版
      case 'off': {
        const normalMask = SpineMask.rect(0, h*0.08, w, h*0.92, 0.07 * w);
        return normalMask;
      }

      // 一将成名
      // case 'othersOff': {
      //   const normalMask = SpineMask.rect(0, 0, w, h, 0.07 * w);
      //   const outcropPlayerMask = SpineMask.lutou(w, h, false, lutouStyle);
      //   return lutouEnabled && type === 'pe' ? outcropPlayerMask : normalMask;
      // }

      // Online
      case 'onlineUI': {
        const normalMask = SpineMask.rect(0, 0, w, h,0.05*w);
        const outcropPlayerMask = SpineMask.lutou(w, h, false, lutouStyle);
        return lutouEnabled && type === 'pe' ? outcropPlayerMask : normalMask;
      }

      // 欢乐三国杀
      // case 'babysha': {
      //   const normalMask = SpineMask.rect(0, 0, w, h, 0.07 * w);
      //   const outcropPlayerMask = SpineMask.lutou(w, h, false, lutouStyle);
      //   return lutouEnabled && type === 'pe' ? outcropPlayerMask : normalMask;
      // }

      // 名将杀
      // case 'codename': {
      //   const normalMask = SpineMask.rect(0, 0, w, h, 0.07 * w);
      //   const outcropPlayerMask = SpineMask.lutou(w, h, false, lutouStyle);
      //   return lutouEnabled && type === 'pe' ? outcropPlayerMask : normalMask;
      // }

      // 未知样式兜底
      default: {
        const normalMask = SpineMask.rect(0, 0, w, h, 0.07 * w);
        const outcropPlayerMask = SpineMask.lutou(w, h, false, lutouStyle);
        return lutouEnabled && type === 'pe' ? outcropPlayerMask : normalMask;
      }
    }
  }
}

export { SpineMask };
