app.import(function(lib, game, ui, get, ai, _status, app) {
	var plugin = {
		name: 'character',
		filter: function() {
			return !['chess', 'tafang'].includes(get.mode());
		},
		content: function(next) {},
		precontent: function() {
			app.reWriteFunction(lib, {
				setIntro: [function(args, node) {
					if (get.itemtype(node) === 'player') {
						if (lib.config.touchscreen) {
							lib.setLongPress(node, plugin.click.playerIntro);
						} else {
							if (lib.config.right_info) {
								node.oncontextmenu = plugin.click.playerIntro;
							}
						}
						return node;
					}
				}],
			});


		},

		click: {
			identity: function(e) {
				e.stopPropagation();
				var player = this.parentNode;
				if (!game.getIdentityList) return;
				if (player.node.guessDialog) {
					player.node.guessDialog.classList.toggle('hidden');
				} else {
					var list = game.getIdentityList(player);
					if (!list) return;
					var guessDialog = ui.create.div('.guessDialog', player);
					var container = ui.create.div(guessDialog);

					lib.setScroll(guessDialog);
					player.node.guessDialog = guessDialog;
				}
			},
			playerIntro: function(e) {
				e.stopPropagation();

				if (plugin.playerDialog) {
					return plugin.playerDialog.show(this);
				}

				var container = ui.create.div('.popup-container.hidden', ui.window, function(e) {
					if (e.target === container) {
						container.hide();
						game.resume2();
					}
				});
				var dialog = ui.create.div('.character-dialog.popped', container);
				var leftPane = ui.create.div('.left', dialog);
				var rightPane = ui.create.div('.right', dialog);


				var createButton = function(name, parent) {
					if (!name) return;
					if (!lib.character[name]) return;
					var button = ui.create.button(name, 'character', parent, true);
				};

				container.show = function(player) {
					//通过势力判断技能框的背景颜色
					var extensionPath = lib.assetURL + 'extension/十周年UI/shoushaUI/';
					var group = player.group;
					if (group != 'wei' && group != 'shu' && group != 'wu' && group != 'qun' &&
						group != 'ye' &&
						group != 'jin' && group != 'daqin' && group != 'western' && group !=
						'shen' && group != 'key')
						group = 'default';
					var url = extensionPath + 'character/images/shizhounian/skt_' + group + '.png';
					dialog.style.backgroundImage = 'url("' + url + '")';
					var skin1 = ui.create.div('.skin1', dialog);
					var skin2 = ui.create.div('.skin2', dialog);

					//判断是否隐藏，以及获取主副将的姓名
					var name = player.name1 || player.name;
					var name2 = player.name2;
					if (player.classList.contains('unseen') && player !== game.me) {
						name = 'unknown';
					}
					if (player.classList.contains('unseen2') && player !== game.me) {
						name2 = 'unknown';
					}

					//主将立绘
					var playerSkin;
					if (name != 'unknown') {
						playerSkin = player.style.backgroundImage;
						if (!playerSkin) playerSkin = player.childNodes[0].style.backgroundImage;

						// 提取原始图片路径
						let originalPath = '';
						if (playerSkin.indexOf('url("') == 0) {
							originalPath = playerSkin.slice(5, playerSkin.indexOf('")'));
						} else if (playerSkin.indexOf("url('") == 0) {
							originalPath = playerSkin.slice(5, playerSkin.indexOf("')"));
						}

						// 创建新图片测试lihui路径
						let testImg = new Image();
						testImg.onerror = function() {
							// lihui路径不存在，使用原始路径
							skin1.style.backgroundImage = playerSkin;
						};
						testImg.onload = function() {
							// lihui路径存在，使用lihui路径
							skin1.style.backgroundImage = 'url("' + this.src + '")';
						};
						// 尝试lihui路径
						testImg.src = originalPath.replace(/image\/character/, 'image/lihui');
					} else {
						var url = extensionPath + 'character/images/unknown.png';
						skin1.style.backgroundImage = 'url("' + url + '")';
					}

					//副将立绘
					if (name2) {
						var playerSkin2;
						if (name2 != 'unknown') {
							playerSkin2 = player.childNodes[1].style.backgroundImage;

							// 提取原始图片路径
							let originalPath = '';
							if (playerSkin2.indexOf('url("') == 0) {
								originalPath = playerSkin2.slice(5, playerSkin2.indexOf('")'));
							} else if (playerSkin2.indexOf("url('") == 0) {
								originalPath = playerSkin2.slice(5, playerSkin2.indexOf("')"));
							}

							// 创建新图片测试lihui路径
							let testImg = new Image();
							testImg.onerror = function() {
								// lihui路径不存在，使用原始路径
								skin2.style.backgroundImage = playerSkin2;
							};
							testImg.onload = function() {
								// lihui路径存在，使用lihui路径
								skin2.style.backgroundImage = 'url("' + this.src + '")';
							};
							// 尝试lihui路径
							testImg.src = originalPath.replace(/image\/character/, 'image/lihui');
						} else {
							var url = extensionPath + 'character/images/unknown.png';
							skin2.style.backgroundImage = 'url("' + url + '")';
						}
					}

					//等阶。适配最新版千幻
					var rarity = game.getRarity(name);
					if (!rarity) rarity = 'junk';
					var pe = ui.create.div('.pe1', dialog);
					var url;
					if (lib.config['extension_千幻聆音_enable']) {
						var temp;
						switch (game.qhly_getSkinLevel(name, game.qhly_getSkin(name), true,
							false)) {
							case 'xiyou':
								temp = 'rare';
								break;
							case 'shishi':
								temp = 'epic';
								break;
							case 'chuanshuo':
								temp = 'legend';
								break;
							case 'putong':
								temp = 'common';
								break;
							case 'dongtai':
								temp = 'legend';
								break;
							case 'jueban':
								temp = 'unique';
								break;
							case 'xianding':
								temp = 'restrictive';
								break;
							default:
								temp = 'junk';
						}
						url = extensionPath + 'character/images/shizhounian/pe_' + temp + '.png';
					} else url = extensionPath + 'character/images/shizhounian/pe_' + rarity +
						'.png';
					pe.style.backgroundImage = 'url("' + url + '")';
					let value = '';
					let value2, value3;
					if (lib.config['extension_千幻聆音_enable']) {
						value2 = game.qhly_getSkinInfo(name, game.qhly_getSkin(name), null).translation || '经典形象';
					} else value2 = '经典形象';
					value += value2 + '*' + get.translation(name);
					if (name2) {
						value += '<br>';
						if (lib.config['extension_千幻聆音_enable']) {
							value3 = game.qhly_getSkinInfo(name2, game.qhly_getSkin(name2), null).translation || '经典形象';
						} else value3 = '经典形象';
						value += value3 + '*' + get.translation(name2);
					}
					var pn = ui.create.div('.pn1', value);
					pe.appendChild(pn);

					//武将姓名
					var nametext = '';
					if (name && name2) {
						if (name == 'unknown') nametext += '未知';
						else if (lib.translate[name + '_ab']) nametext += lib.translate[name +
							'_ab'];
						else nametext += get.translation(name);
						nametext += ' / ';
						if (name2 == 'unknown') nametext += '未知';
						else if (lib.translate[name2 + '_ab']) nametext += lib.translate[name2 +
							'_ab'];
						else nametext += get.translation(name2);
					} else {
						if (name == 'unknown') nametext += '未知';
						else if (lib.translate[name + '_ab']) nametext += lib.translate[name +
							'_ab'];
						else nametext += get.translation(name);
					}
					var namestyle = ui.create.div('.name', nametext, dialog);
					namestyle.dataset.camp = group;
					if (name && name2) {
						namestyle.style.fontSize = '18px';
						namestyle.style.letterSpacing = '1px';
					}

					//等阶图标
					var head = ui.create.node('img');
					head.src = extensionPath + 'character/images/shizhounian/rarity_' + rarity +
						'.png';
					head.style.cssText =
						"display:inline-block;width:61.6px;height:53.2px;top:-13px; position:absolute;background-color: transparent;z-index:1;margin-left:5px;";
					namestyle.appendChild(head);

					//分包
					var getPack = function(name) {
						for (const pak in lib.characterSort) {
							for (const package in lib.characterSort[pak]) {
								if (lib.characterSort[pak][package].includes(name)) {
									if (pak == 'standard' || package == 'sp_waitforsort' ||
										package == 'sp_qifu' || package == 'sp_others' ||
										package == 'sp_guozhan2' ||
										pak == 'old' || pak == 'diy' || pak == 'collab')
										return lib.translate[pak + '_character_config'];
									if (pak == 'sp') {
										if (get.translation(package).length > 6) return get
											.translation(package).slice(0, 2);
									}
									if (pak == 'sp2') {
										if (get.translation(package).length > 6) return get
											.translation(package).slice(3, 7);
									}
									if (pak == 'mobile') {
										if (get.translation(package).length > 6) return '手杀异构';
									}
									if (pak == 'WeChatkill') return '微信三国杀';
									if (pak == 'tw') return '海外';
									if (pak == 'MiNikill') return '欢乐三国杀';
									switch (package) {
										case 'sp_decade':
										case 'extra_decade':
											return '限定';
										case 'extra_tw':
											return '海外';
										case 'mobile_default':
										case 'mobile_sunben':
											return '手杀';
										case 'offline_piracyE':
											return '官盗E系列';
										default:
											return get.translation(package);
									}
								}
							}
						}
						for (const pak in lib.characterPack) {
							for (const namein in lib.characterPack[pak]) {
								if (name == namein) return get.translation(pak +
									'_character_config');
							}
						}
						return '暂无分包';
					}
					var packinfo = ui.create.div('.pack', getPack(name), dialog);



					leftPane.innerHTML = '<div></div>';
					rightPane.innerHTML = '<div></div>';
					lib.setScroll(rightPane.firstChild);
					var hSkills = player.getCards('h');
					var eSkills = player.getCards('e');
					var oSkills = player.getSkills(null, false, false).slice(0);
					if (player == game.me) oSkills = oSkills.concat(player.hiddenSkills);
					var judges = player.getCards('j');
					if (oSkills.length) {
						oSkills.forEach(function(name) {
							var translation = lib.translate[name];
							if (translation && lib.translate[name + '_info'] &&
								translation != '' && lib.translate[name + '_info'] != '') {
								if (!player.getSkills().includes(name) || player
									.awakenedSkills.includes(name)) ui.create.div('.xskill',
									'<div data-color>' + '<span style="opacity:0.5">' +
									translation + '： ' + '</span>' +
									'</div>' + '<div>' +
									'<span style="opacity:0.5;text-indent:10px">' + get
									.skillInfoTranslation(name, player) + '</span>' +
									'</div>', rightPane.firstChild);
								else ui.create.div('.xskill', '<div data-color>' +
									translation + '： </div>' + '<div>' +
									'<span style="text-indent:10px">' + get
									.skillInfoTranslation(name, player) + '</span>' +
									'</div>', rightPane.firstChild);
								//自动发动
								if (lib.skill[name].frequent || lib.skill[name]
									.subfrequent) {
									ui.create.div('.xskill',
										'<div class="underlinenode on gray" style="position:relative;padding-left:0;padding-bottom:3px">【' +
										translation + '】自动发动</div></div></div>',
										rightPane.firstChild);
									var underlinenode = rightPane.firstChild.querySelector(
										'.underlinenode');
									if (lib.skill[name].frequent) {
										if (lib.config.autoskilllist.includes(name)) {
											underlinenode.classList.remove('on');
										}
									}
									if (lib.skill[name].subfrequent) {
										for (var j = 0; j < lib.skill[name].subfrequent
											.length; j++) {
											if (lib.config.autoskilllist.includes(name +
													'_' + lib.skill[name].subfrequent[j])) {
												underlinenode.classList.remove('on');
											}
										}
									}
									if (lib.config.autoskilllist.includes(name)) {
										underlinenode.classList.remove('on');
									}
									underlinenode.link = name;
									underlinenode.listen(ui.click.autoskill2);
								}
							}
						});
					}

					if (judges.length) {
						ui.create.div('.xcaption', '判定区域', rightPane.firstChild);
						judges.forEach(function(card) {
							ui.create.div('.xskill', '<div data-color>' + get.translation(
									card) + '</div><div>' + get.translation((card
									.viewAs || card.name) + '_info') + '</div>',
								rightPane.firstChild);
						});
					}

					if (eSkills.length) {
						ui.create.div('.xcaption', '装备区域', rightPane.firstChild);
						eSkills.forEach(function(item) {
							ui.create.div('.xskill', '<div data-color>' + get.translation(
								item) + '</div><div>' + get.translation(item.name +
								'_info') + '</div>', rightPane.firstChild);
						});
					}

					if (player != game.me && !player.noclick && (player.isUnderControl() || (!game
							.observe && game.me && game.me.hasSkillTag('viewHandcard', null,
								player, true)))) {
						ui.create.div('.xcaption', '手牌区域', rightPane.firstChild);
						hSkills.forEach(function(item) {
							var button = ui.create.button(item, 'card', rightPane
								.firstChild, true);
							button.style.zoom = 0.65;
							button.style.marginTop = 0;
						});
					}


					container.classList.remove('hidden');
					game.pause2();
				};
				plugin.characterDialog = container;
				container.show(this);
			},
		},

	};
	return plugin;
});