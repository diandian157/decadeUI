## 扩展介绍

无名杀游戏的界面美化扩展

## 使用方法

### 普通用户游玩

1. 下载Releases文件
2. 将整个文件夹放入无名杀的 `extension` 目录下
3. 打开本体设置-选项-通用-自动导入扩展
4. 重启游戏，在扩展列表中启用"十周年UI"

### 开发模式

1. 克隆本项目到本地
2. 放入无名杀根目录的 `packages/extension` 文件夹，命名为"十周年UI"
3. 返回无名杀根目录依次执行：

```bash
pnpm i
pnpm dev
```

详情见：[如何运行无名杀（程序员版）](https://github.com/libnoname/noname/wiki/%E5%A6%82%E4%BD%95%E8%BF%90%E8%A1%8C%E6%97%A0%E5%90%8D%E6%9D%80%EF%BC%88%E7%A8%8B%E5%BA%8F%E5%91%98%E7%89%88%EF%BC%89)

## 使用帮助

详细的配置说明请参考 `docs/` 目录：

- [卡牌皮肤注册](docs/card-skin-api.md) - 外部扩展注册卡牌皮肤的方法
- [前缀角标注册](docs/prefix-mark-api.md) - 武将前缀角标的配置方法
- [动态皮肤与扩展兼容 API](docs/dynamic-skin-api.md) - 动皮配置、共享 Canvas、新旧 API 兼容与换肤扩展迁移方法
- [露头头像配置](docs/outcrop-avatar-api.md) - 露头头像的目录结构和API
- [普通 Spine 与骨骼动画定位](docs/spine-positioning-api.md) - 全屏特效层、外部扩展播放 API 和定位系统说明
- [版本更新日志](docs/update.md) - 十周年UI版本更新日志
- [报错兜底处理](docs/secret.md) - 与无名杀版本不匹配下游玩方法

## 动态背景

进入“十周年UI设置 → 外观 → 动态背景”，可选择已配置的动态底背景；选择“关闭”即可停止播放。

动态背景列表来自 `src/skins/dynamicBackground.js` 中的 `dynamicBackgroundConfig`。新增配置示例：

```javascript
export const dynamicBackgroundConfig = {
	"显示名称": {
		name: "武将/皮肤/daiji",
		version: "4.0",
		x: [0, 0.5],
		y: [0, 0.5],
		scale: 1.5,
		beijing: {
			name: "武将/皮肤/beijing",
			version: "4.0",
			x: [0, 0.5],
			y: [0, 0.5],
			scale: 1.5,
		},
	},
};
```

骨骼资源放在 `assets/dynamic/` 下，`name` 填写相对路径，不需要扩展名。主体和 `beijing` 会在独立底背景 Canvas 中分层循环播放，并自动响应窗口 resize。

完整改动见 [本次改动说明](docs/update.md)。

## 相关链接

- 无名杀游戏：https://github.com/libnoname/noname

## 相关人员

- 原创作者：短歌
- 手杀UI原作者：橙续缘
- 上任维护者：萌新(转型中)
- 当前维护者：点点

## 许可证

GPL-3.0
