const dynamicCanvasLayers = {
	bottom: {
		canvasId: "decadeUI-canvas-dynamic-bottom",
		cssZIndex: 1,
		containers: {
			background: 0,
			player: 2,
		},
	},
	player: {
		canvasId: "decadeUI-canvas-dynamic-player",
		cssZIndex: 5,
		containers: {
			player: 0,
		},
	},
	domEffect: {
		canvasId: "decadeUI-canvas-dom-effect",
		cssZIndex: 12,
		containers: {
			card: 1,
			playerEffect: 2,
			fullscreenEffect: 2,
			skEffect: 3,
		},
	},
	upper: {
		canvasId: "decadeUI-canvas",
		layaCanvasId: "decadeUI-canvas-sk",
		cssZIndex: 12,
		layaCssZIndex: 12,
		containers: {
			card: 1,
			playerEffect: 2,
			fullscreenEffect: 2,
			skEffect: 3,
		},
	},
};

export { dynamicCanvasLayers };
