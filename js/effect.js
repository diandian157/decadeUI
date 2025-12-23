"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	const CONSTANTS = {
		ANIMATION: {
			SPEED: 0.07,
			FRAME_RATE: 17,
			LINE_COLOR: "rgb(250,220,140)",
			LINE_WIDTH: 2.6,
		},
		DURATION: {
			EFFECT: 2180,
			KILL_DELAY: 2000,
			KILL_CLOSE: 3000,
		},
		KILL: {
			LIGHT_COUNT: 10,
			SCALE_FACTOR: 1.2,
			MAX_SCALE: 1.0,
			MIN_SCALE: 0.1,
		},
		SKILL: {
			MAX_WIDTH: 288,
			MAX_HEIGHT: 378,
			NAME_OFFSET_Y: 165,
			GENERAL_OFFSET_X: 200,
			GENERAL_OFFSET_Y: 160,
		},
		STYLES: {
			EFFECT_WINDOW: {
				backgroundColor: "rgba(0,0,0,0.7)",
				transition: "all 4s",
				zIndex: 7,
			},
			GENERAL_NAME: {
				position: "absolute",
				writingMode: "vertical-lr",
				textOrientation: "upright",
				fontFamily: "yuanli",
				color: "rgb(215, 234, 67)",
				fontSize: "25px",
				textShadow: "0 0 5px black, 0 0 10px black",
				pointerEvents: "none",
				letterSpacing: "5px",
				zIndex: 17,
			},
		},
	};

	const utils = {
		getPlayerAvatar(player, isUnseen = false) {
			return isUnseen ? player.node.avatar2 : player.node.avatar;
		},
		parseCssUrl(url) {
			if (url.startsWith('url("')) {
				return url.slice(5, url.indexOf('")'));
			}
			if (url.startsWith("url('")) {
				return url.slice(5, url.indexOf("')"));
			}
			return url;
		},
		createElement(className, parent = null, styles = {}) {
			const element = decadeUI.dialog.create(className, parent);
			Object.assign(element.style, styles);
			return element;
		},
		removeChildSafely(parent, child) {
			if (parent?.contains(child)) {
				parent.removeChild(child);
			}
		},
		validatePlayer(player, paramName = "player") {
			if (get.itemtype(player) !== "player") {
				console.error(`Invalid ${paramName}: expected player object`);
				return false;
			}
			return true;
		},
		async checkImageExists(url) {
			return new Promise(resolve => {
				const img = new Image();
				img.onload = () => resolve(true);
				img.onerror = () => resolve(false);
				img.src = url;
			});
		},
		async getOptimalImagePath(originalUrl, player) {
			const parsedUrl = this.parseCssUrl(originalUrl);
			if (parsedUrl.includes("image/lihui")) {
				return parsedUrl;
			}
			if (parsedUrl.includes("image/character")) {
				const lihuiPath = parsedUrl.replace(/image\/character/, "image/lihui");
				const lihuiExists = await this.checkImageExists(lihuiPath);
				if (lihuiExists) {
					return lihuiPath;
				}
			}
			return parsedUrl;
		},
		getDefaultAvatarPath(player) {
			const gender = player.sex === "female" ? "female" : "male";
			return `${lib.assetURL}image/character/default_silhouette_${gender}.jpg`;
		},
		generateRandomPosition(height) {
			const signX = decadeUI.getRandom(0, 1) === 1 ? "" : "-";
			const signY = decadeUI.getRandom(0, 1) === 1 ? "" : "-";
			const x = `${signX}${decadeUI.getRandom(0, 100)}px`;
			const y = `${signY}${decadeUI.getRandom(0, height / 4)}px`;
			const scale = decadeUI.getRandom(1, 10) / 10;
			return { x, y, scale };
		},
		getPlayerNameWithPrefix(player, useName2 = false) {
			const name = useName2 ? player.name2 : player.name;
			if (!name) return "";
			return get.slimNameHorizontal(name);
		},
	};
	decadeUI.effect = {
		dialog: {
			create() {
				return decadeUI.dialog.create("effect-dialog dui-dialog");
			},
			compare(source, target) {
				const dialog = this.create();
				dialog.characters = [utils.createElement("player1 character", dialog), utils.createElement("player2 character", dialog)];
				dialog.characters.forEach(char => {
					utils.createElement("back", char);
				});
				dialog.content = utils.createElement("content", dialog);
				dialog.buttons = utils.createElement("buttons", dialog.content);
				dialog.cards = [utils.createElement("player1 card", dialog.buttons), utils.createElement("player2 card", dialog.buttons)];
				dialog.names = [utils.createElement("player1 name", dialog.buttons), utils.createElement("player2 name", dialog.buttons)];
				dialog.buttons.vs = utils.createElement("vs", dialog.buttons);
				dialog.names[0].innerHTML = `${utils.getPlayerNameWithPrefix(source)}发起`;
				dialog.names[1].innerHTML = utils.getPlayerNameWithPrefix(target);

				const playerAttrToIndex = {
					player1: 0,
					source: 0,
					player2: 1,
					target: 1,
				};
				const cardAttrToIndex = {
					card1: 0,
					sourceCard: 0,
					card2: 1,
					targetCard: 1,
				};

				dialog.set = function (attr, value) {
					if (attr in playerAttrToIndex) {
						const playerIndex = playerAttrToIndex[attr];
						const isSource = playerIndex === 0;
						const suffix = isSource ? "发起" : "";

						if (get.itemtype(value) !== "player" || value.isUnseen()) {
							dialog.characters[playerIndex].firstChild.style.backgroundImage = "";
							dialog.names[playerIndex].innerHTML = `${utils.getPlayerNameWithPrefix(value)}${suffix}`;
							return false;
						}
						const avatar = utils.getPlayerAvatar(value, value.isUnseen(0));
						dialog.characters[playerIndex].firstChild.style.backgroundImage = avatar.style.backgroundImage;
						dialog.names[playerIndex].innerHTML = `${utils.getPlayerNameWithPrefix(value)}${suffix}`;
						return true;
					}

					if (attr in cardAttrToIndex) {
						const cardIndex = cardAttrToIndex[attr];
						utils.removeChildSafely(dialog.cards[cardIndex], dialog.cards[cardIndex].firstChild);
						dialog.cards[cardIndex].appendChild(value);
						return true;
					}

					return false;
				};

				dialog.set("source", source);
				dialog.set("target", target);
				return dialog;
			},
		},
		line(dots) {
			decadeUI.animate.add(
				function (source, target, e) {
					const ctx = e.context;
					ctx.shadowColor = "yellow";
					ctx.shadowBlur = 1;

					if (!this.head) this.head = 0;
					if (!this.tail) this.tail = -1;

					const speed = CONSTANTS.ANIMATION.SPEED * (e.deltaTime / CONSTANTS.ANIMATION.FRAME_RATE);
					this.head += speed;
					if (this.head >= 1) {
						this.head = 1;
						this.tail += speed;
					}

					const tail = Math.max(0, this.tail);
					const head = this.head;

					if (this.tail <= 1) {
						const x1 = decadeUI.get.lerp(source.x, target.x, tail);
						const y1 = decadeUI.get.lerp(source.y, target.y, tail);
						const x2 = decadeUI.get.lerp(source.x, target.x, head);
						const y2 = decadeUI.get.lerp(source.y, target.y, head);
						e.drawLine(x1, y1, x2, y2, CONSTANTS.ANIMATION.LINE_COLOR, CONSTANTS.ANIMATION.LINE_WIDTH);
						return false;
					}
					return true;
				},
				true,
				{ x: dots[0], y: dots[1] },
				{ x: dots[2], y: dots[3] }
			);
		},
		kill(source, target) {
			if (!utils.validatePlayer(source, "source") || !utils.validatePlayer(target, "target")) {
				throw new Error("Invalid arguments: source and target must be valid players");
			}
			if (source === target || source.isUnseen() || target.isUnseen()) return;

			const sourceAvatar = utils.getPlayerAvatar(source, source.isUnseen(0));
			const targetAvatar = utils.getPlayerAvatar(target, target.isUnseen(0));
			const effect = utils.createElement("effect-window", null, CONSTANTS.STYLES.EFFECT_WINDOW);

			const killerWrapper = utils.createElement("killer-warpper", effect);
			killerWrapper.killer = utils.createElement("killer", killerWrapper);
			killerWrapper.killer.style.backgroundImage = sourceAvatar.style.backgroundImage;

			const victim = utils.createElement("victim", effect);
			victim.back = utils.createElement("back", victim);
			victim.back.part1 = utils.createElement("part1", victim.back);
			victim.back.part2 = utils.createElement("part2", victim.back);
			const victimImage = targetAvatar.style.backgroundImage;
			victim.back.part1.style.backgroundImage = victimImage;
			victim.back.part2.style.backgroundImage = victimImage;

			game.playAudio("../extension", decadeUI.extensionName, "audio/kill_effect_sound.mp3");

			const anim = decadeUI.animation;
			const bounds = anim.getSpineBounds("effect_jisha1");
			if (bounds === undefined) {
				this._createFallbackKillEffect(effect, victim);
			} else {
				this._createSpineKillEffect(anim, bounds, effect);
			}

			decadeUI.delay(CONSTANTS.DURATION.KILL_DELAY);
			effect.style.backgroundColor = "rgba(0,0,0,0)";
			effect.close(CONSTANTS.DURATION.KILL_CLOSE);
		},
		skill(player, skillName, vice) {
			if (!utils.validatePlayer(player)) return;
			const animation = decadeUI.animation;
			const asset = animation.spine.assets.effect_xianding;
			if (!asset) {
				console.error("[effect_xianding]特效未加载");
				return;
			}
			if (!asset.ready) {
				animation.prepSpine("effect_xianding");
			}

			const camp = player.group;
			const playerName = utils.getPlayerNameWithPrefix(player, vice === "vice");
			const playerAvatar = utils.getPlayerAvatar(player, vice === "vice");

			this._loadSkillImages(playerAvatar, camp, player, skillName, playerName).catch(error => {
				console.error("技能特效图片加载失败:", error);
			});
		},
		_createFallbackKillEffect(effect, victim) {
			utils.createElement("li-big", effect);
			victim.rout = utils.createElement("rout", victim);
			victim.rout2 = utils.createElement("rout", victim);
			victim.rout.innerHTML = "破敌";
			victim.rout2.innerHTML = "破敌";
			victim.rout2.classList.add("shadow");
			ui.window.appendChild(effect);

			const height = ui.window.offsetHeight;
			for (let i = 0; i < CONSTANTS.KILL.LIGHT_COUNT; i++) {
				const { x, y, scale } = utils.generateRandomPosition(height);
				setTimeout(
					(mx, my, mscale, meffect) => {
						const light = utils.createElement("li", meffect);
						light.style.transform = `translate(${mx}, ${my}) scale(${mscale})`;
					},
					decadeUI.getRandom(50, 300),
					x,
					y,
					scale,
					effect
				);
			}
		},
		_createSpineKillEffect(anim, bounds, effect) {
			const size = bounds.size;
			const scale = (anim.canvas.width / size.x) * CONSTANTS.KILL.SCALE_FACTOR;
			anim.playSpine("effect_jisha1", { scale });
			ui.window.appendChild(effect);
			ui.refresh(effect);
		},
		async _loadSkillImages(playerAvatar, camp, player, skillName, playerName) {
			const url = getComputedStyle(playerAvatar).backgroundImage;
			const image = new Image();
			const bgImage = new Image();

			image.onload = () => {
				bgImage.onload = () => {
					this._createSkillEffect(image, bgImage, camp, skillName, playerName);
				};
				bgImage.onerror = () => {
					bgImage.onerror = null;
					bgImage.src = `${decadeUIPath}assets/image/bg_xianding_qun.png`;
				};
				bgImage.src = `${decadeUIPath}assets/image/bg_xianding_${camp}.png`;
			};

			image.onerror = () => {
				image.onerror = null;
				this._handleImageError(image, url, player);
			};

			try {
				const optimalPath = await utils.getOptimalImagePath(url, player);
				image.src = optimalPath;
			} catch (error) {
				console.warn("获取图片路径失败，使用默认路径:", error);
				image.src = utils.getDefaultAvatarPath(player);
			}
		},
		_createSkillEffect(image, bgImage, camp, skillName, playerName) {
			const animation = decadeUI.animation;
			const sprite = animation.playSpine("effect_xianding");
			if (!sprite?.skeleton) {
				console.error("Spine动画未正确加载，sprite或skeleton为undefined");
				return;
			}
			const skeleton = sprite.skeleton;
			this._setupBackgroundAttachment(skeleton, bgImage, camp, animation);
			this._setupGeneralAttachment(skeleton, image, animation);

			const size = skeleton.bounds.size;
			sprite.scale = Math.max(animation.canvas.width / size.x, animation.canvas.height / size.y);
			this._createSkillUI(skillName, playerName, sprite.scale);
		},
		_setupBackgroundAttachment(skeleton, bgImage, camp, animation) {
			const slot = skeleton.findSlot("shilidipan");
			const attachment = slot.getAttachment();
			if (attachment.camp !== camp) {
				if (!attachment.cached) attachment.cached = {};
				if (!attachment.cached[camp]) {
					attachment.cached[camp] = animation.createTextureRegion(bgImage);
				}
				const region = attachment.cached[camp];
				attachment.width = region.width;
				attachment.height = region.height;
				attachment.setRegion(region);
				attachment.updateOffset();
				attachment.camp = camp;
			}
		},
		_setupGeneralAttachment(skeleton, image, animation) {
			const slot = skeleton.findSlot("wujiang");
			const attachment = slot.getAttachment();
			const region = animation.createTextureRegion(image);
			const scale = Math.min(CONSTANTS.SKILL.MAX_WIDTH / region.width, CONSTANTS.SKILL.MAX_HEIGHT / region.height);
			attachment.width = region.width * scale;
			attachment.height = region.height * scale;
			attachment.setRegion(region);
			attachment.updateOffset();
		},
		_createSkillUI(skillName, playerName, spriteScale) {
			const effect = decadeUI.element.create("skill-name");
			effect.innerHTML = skillName;
			effect.style.top = `calc(50% + ${CONSTANTS.SKILL.NAME_OFFSET_Y * spriteScale}px)`;

			const nameEffect = decadeUI.element.create("general-name");
			nameEffect.innerHTML = playerName;

			const generalStyles = {
				...CONSTANTS.STYLES.GENERAL_NAME,
				right: `calc(50% - ${CONSTANTS.SKILL.GENERAL_OFFSET_X * spriteScale}px)`,
				top: `calc(50% - ${CONSTANTS.SKILL.GENERAL_OFFSET_Y * spriteScale}px)`,
			};

			const toKebabCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
			nameEffect.style.cssText = Object.entries(generalStyles)
				.map(([key, value]) => `${toKebabCase(key)}: ${value}`)
				.join("; ");

			ui.arena.appendChild(effect);
			ui.arena.appendChild(nameEffect);
			effect.removeSelf(CONSTANTS.DURATION.EFFECT);
			nameEffect.removeSelf(CONSTANTS.DURATION.EFFECT);
		},
		async _handleImageError(image, url, player) {
			if (image.src.includes("image/lihui")) {
				const originalUrl = utils.parseCssUrl(url);
				if (originalUrl !== image.src) {
					image.src = originalUrl;
					return;
				}
			}
			if (image.src.includes("image/character")) {
				const lihuiPath = image.src.replace(/image\/character/, "image/lihui");
				const lihuiExists = await utils.checkImageExists(lihuiPath);
				if (lihuiExists) {
					image.src = lihuiPath;
					return;
				}
			}
			image.src = utils.getDefaultAvatarPath(player);
		},
	};
});
