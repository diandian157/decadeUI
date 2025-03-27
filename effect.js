"use strict";
decadeModule.import(function(lib, game, ui, get, ai, _status) {
	decadeUI.effect = {
		dialog: {
			create(titleText) {
				return decadeUI.dialog.create("effect-dialog dui-dialog");
			},
			compare(source, target) {
				var dialog = this.create();

				dialog.characters = [decadeUI.dialog.create("player1 character", dialog), decadeUI.dialog
					.create("player2 character", dialog)
				];

				decadeUI.dialog.create("back", dialog.characters[0]), decadeUI.dialog.create("back", dialog
					.characters[1]), (dialog.content = decadeUI.dialog.create("content", dialog)), (
					dialog.buttons = decadeUI.dialog.create("buttons", dialog.content));

				dialog.cards = [decadeUI.dialog.create("player1 card", dialog.buttons), decadeUI.dialog
					.create("player2 card", dialog.buttons)
				];

				dialog.names = [decadeUI.dialog.create("player1 name", dialog.buttons), decadeUI.dialog
					.create("player2 name", dialog.buttons)
				];

				dialog.buttons.vs = decadeUI.dialog.create("vs", dialog.buttons);
				dialog.names[0].innerHTML = get.translation(source) + "发起";
				dialog.names[1].innerHTML = get.translation(target);

				(dialog.set = function(attr, value) {
					switch (attr) {
						case "player1":
						case "source":
							if (get.itemtype(value) != "player" || value.isUnseen()) {
								dialog.characters[0].firstChild.style.backgroundImage = "";
								dialog.names[0].innerHTML = get.translation(value) + "发起";
								return false;
							}

							var avatar = value.isUnseen(0) ? value.node.avatar2 : value.node.avatar;
							dialog.characters[0].firstChild.style.backgroundImage = avatar.style
								.backgroundImage;
							dialog.names[0].innerHTML = get.translation(value) + "发起";
							break;

						case "player2":
						case "target":
							if (get.itemtype(value) != "player" || value.isUnseen()) {
								dialog.characters[1].firstChild.style.backgroundImage = "";
								dialog.names[1].innerHTML = get.translation(value);
								return false;
							}

							var avatar = value.isUnseen(0) ? value.node.avatar2 : value.node.avatar;
							dialog.characters[1].firstChild.style.backgroundImage = avatar.style
								.backgroundImage;
							dialog.names[1].innerHTML = get.translation(value);
							break;

						case "card1":
						case "sourceCard":
							if (dialog.cards[0].firstChild) dialog.cards[0].removeChild(dialog.cards[0]
								.firstChild);
							dialog.cards[0].appendChild(value);
							break;

						case "card2":
						case "targetCard":
							if (dialog.cards[1].firstChild) dialog.cards[1].removeChild(dialog.cards[1]
								.firstChild);
							dialog.cards[1].appendChild(value);
							break;

						default:
							return false;
					}

					return true;
				}),
				dialog.set("source", source);
				dialog.set("target", target);
				return dialog;
			},
		},
		line(dots) {
			decadeUI.animate.add(
				function(source, target, e) {
					var ctx = e.context;
					ctx.shadowColor = "yellow";
					ctx.shadowBlur = 1;

					if (!this.head) this.head = 0;
					if (!this.tail) this.tail = -1;

					this.head += 0.07 * (e.deltaTime / 17);
					if (this.head >= 1) {
						this.head = 1;
						this.tail += 0.07 * (e.deltaTime / 17);
					}

					var tail = this.tail < 0 ? 0 : this.tail;
					var head = this.head;
					if (this.tail <= 1) {
						var x1 = decadeUI.get.lerp(source.x, target.x, tail);
						var y1 = decadeUI.get.lerp(source.y, target.y, tail);
						var x2 = decadeUI.get.lerp(source.x, target.x, head);
						var y2 = decadeUI.get.lerp(source.y, target.y, head);
						e.drawLine(x1, y1, x2, y2, "rgb(250,220,140)", 2.6);
						return false;
					} else {
						return true;
					}
				},
				true, {
					x: dots[0],
					y: dots[1]
				}, {
					x: dots[2],
					y: dots[3]
				}
			);
		},

		kill(source, target) {
			if (get.itemtype(source) != "player" || get.itemtype(target) != "player") throw "arguments";
			if (source == target) return;

			if (source.isUnseen() || target.isUnseen()) return;

			var sourceAvatar = source.isUnseen(0) ? source.node.avatar2 : source.node.avatar;
			var targetAvatar = target.isUnseen(0) ? target.node.avatar2 : target.node.avatar;

			var effect = decadeUI.dialog.create('effect-window');
			var killerWarpper = decadeUI.dialog.create('killer-warpper', effect);
			killerWarpper.killer = decadeUI.dialog.create('killer', killerWarpper);
		
		  var characterID= source.name;             
        var picSrc = game.qhly_getAvatarSrc(characterID);
        
	
		if (picSrc && picSrc.indexOf('image/character/') == -1) {
                  var extNameInPic = picSrc.replace('extension/', '');
        if (extNameInPic.indexOf('/') >= 0) {
          extNameInPic = extNameInPic.slice(0, extNameInPic.indexOf('/'));
        }
                 killerWarpper.killer.style.backgroundImage ="url('"+ game.getYuanHuaPath(source,lib.assetURL +'extension/' + extNameInPic + '/skin/yuanhua/')+"')";
            
              }else{
                                    killerWarpper.killer.style.backgroundImage ="url('"+ game.getYuanHuaPath(source,lib.assetURL +'extension/千幻聆音/sanguoyuanhua/')+"')";

		}
	


			var victim = decadeUI.dialog.create('victim', effect);
			victim.back = decadeUI.dialog.create('back', victim);
			victim.back.part1 = decadeUI.dialog.create('part1', victim.back);
			victim.back.part2 = decadeUI.dialog.create('part2', victim.back);
		
	                  characterID= target.name;       
        var picSrc = game.qhly_getAvatarSrc(characterID);
        

	
		if (picSrc && picSrc.indexOf('image/character/') == -1) {
                  var extNameInPic = picSrc.replace('extension/', '');
        if (extNameInPic.indexOf('/') >= 0) {
          extNameInPic = extNameInPic.slice(0, extNameInPic.indexOf('/'));
        }
        victim.back.part1.style.backgroundImage ="url('"+ game.getYuanHuaPath(target,lib.assetURL +'extension/' + extNameInPic + '/skin/yuanhua/')+"')";
                      victim.back.part2.style.backgroundImage ="url('"+ game.getYuanHuaPath(target,lib.assetURL +'extension/' + extNameInPic + '/skin/yuanhua/')+"')";
                 
              }else{
                      victim.back.part1.style.backgroundImage ="url('"+ game.getYuanHuaPath(target,lib.assetURL +'extension/千幻聆音/sanguoyuanhua/')+"')";
                      victim.back.part2.style.backgroundImage ="url('"+ game.getYuanHuaPath(target,lib.assetURL +'extension/千幻聆音/sanguoyuanhua/')+"')";
                      
      }
	

			effect.style.backgroundColor = "rgba(0,0,0,0.7)";
			effect.style.transition = "all 4s";
			effect.style.zIndex = 7;

			var anim = decadeUI.animation;
			var bounds = anim.getSpineBounds("effect_jisha1");
		
			game.playAudio('../extension', decadeUI.extensionName, 'audio/kill_effect_sound.mp3');
			if (bounds == void 0) {
				var lightLarge = decadeUI.dialog.create("li-big", effect);
				victim.rout = decadeUI.dialog.create("rout", victim);
				victim.rout2 = decadeUI.dialog.create("rout", victim);
				victim.rout.innerHTML = "破敌";
				victim.rout2.innerHTML = "破敌";
				victim.rout2.classList.add("shadow");
				ui.window.appendChild(effect);
				var height = ui.window.offsetHeight;
				var x, y, scale;
				for (var i = 0; i < 10; i++) {
					x = decadeUI.getRandom(0, 100) + "px";
					y = decadeUI.getRandom(0, height / 4) + "px";
					x = decadeUI.getRandom(0, 1) == 1 ? x : "-" + x;
					y = decadeUI.getRandom(0, 1) == 1 ? y : "-" + y;
					scale = decadeUI.getRandom(1, 10) / 10;

					setTimeout(
						function(mx, my, mscale, meffect) {
							var light = decadeUI.dialog.create("li", meffect);
							light.style.transform = "translate(" + mx + ", " + my + ")" + "scale(" +
								mscale + ")";
						},
						decadeUI.getRandom(50, 300),
						x,
						y,
						scale,
						effect
					);
				}
			} else {
				var sz = bounds.size;
				var scale = anim.canvas.width / sz.x * 1.2;
			anim.playSpine("effect_jisha1", { scale: 1 });
			   var num = ["",2,3,4,5,6,7].randomGet();
			   var guanjiejisha={name:"../../../十周年UI/assets/animation/SF_guanjie_eff_jisha"};
			   guanjiejisha.action="play"+num;
			   anim.loadSpine(guanjiejisha.name,"skel",function(){
				anim.playSpine(guanjiejisha, {scale: 0.5});
			   })		   
							
				ui.window.appendChild(effect);
				ui.refresh(effect);
			}

			decadeUI.delay(2000);
			effect.style.backgroundColor = "rgba(0,0,0,0)";
			effect.close(3000);
			effect = null;
		},

		skill(player, skillName, vice) {
			if (get.itemtype(player) != "player") return console.error("player");

			var animation = decadeUI.animation;
			var asset = animation.spine.assets["effect_xianding"];
			if (!asset) return console.error("[effect_xianding]特效未加载");
			if (!asset.ready) animation.prepSpine("effect_xianding");

			var camp = player.group;
			var playerName, playerAvatar;
			if (vice === "vice") {
				playerName = get.translation(player.name2);
				playerAvatar = player.node.avatar2;
			} else {
				playerName = get.translation(player.name);
				playerAvatar = player.node.avatar;
			}
	/*var url = getComputedStyle(playerAvatar).backgroundImage;
		
		
			var playername = get.name(player);
                    var skinname = game.getFileName2(player.node.avatar.style.backgroundImage);
                    var skin = lib.assetURL + "lihui/" + playername + "/" + skinname + ".png";
                    var yuanhua = lib.assetURL + "lihui/" + playername + "/" + playername + ".png";
                    if (game.LiHuiFileExist(skin)) url = 'url("' + lib.assetURL + "lihui/" + playername + "/" + skinname +  ".png" + '")';
                     else if (game.LiHuiFileExist(yuanhua)) url = 'url("' + lib.assetURL + "lihui/" + playername + "/" + playername + ".png" + '")';
                    else {
                        url = player.node.avatar.style.backgroundImage;
	}*/
	var path=game.getLiHuiPath(player,lib.assetURL);
	      var  url;
		if(path=="noLihui")  url = player.node.avatar.style.backgroundImage;
		else url=='url("' +path+ '")';
		console.log(url);
			var image = new Image();
			var bgImage = new Image();

			image.onload = function() {
				bgImage.onload = function() {
					var animation = decadeUI.animation;
					var sprite = animation.playSpine("effect_xianding");
					var skeleton = sprite.skeleton;
					var slot = skeleton.findSlot("shilidipan");
					var attachment = slot.getAttachment();
					var region;

					if (attachment.camp !== camp) {
						if (!attachment.cached) attachment.cached = {};

						if (!attachment.cached[camp]) {
							region = animation.createTextureRegion(bgImage);
							attachment.cached[camp] = region;
						} else {
							region = attachment.cached[camp];
						}

						attachment.width = region.width;
						attachment.height = region.height;
						attachment.setRegion(region);
						attachment.updateOffset();
						attachment.camp = camp;
					}

					slot = skeleton.findSlot("wujiang");
					attachment = slot.getAttachment();
					region = animation.createTextureRegion(image);

					var scale = Math.min(288 / region.width, 378 / region.height);
					attachment.width = region.width * scale;
					attachment.height = region.height * scale;
					attachment.setRegion(region);
					attachment.updateOffset();

					var size = skeleton.bounds.size;
					sprite.scale = Math.max(animation.canvas.width / size.x, animation.canvas
						.height / size.y);

					var effect = decadeUI.element.create(
					"skill-name"); // 限定/觉醒特效技能文本显示，如需取消，将 'skill-name' 改为 null
					effect.innerHTML = skillName;
					effect.style.top = "calc(50% + " + 165 * sprite.scale + "px)";

					ui.arena.appendChild(effect);
					effect.removeSelf(2180);
				};

				bgImage.onerror = function() {
					bgImage.onerror = void 0;
					bgImage.src = decadeUIPath + "assets/image/bg_xianding_qun.png";
				};

				bgImage.src = decadeUIPath + "assets/image/bg_xianding_" + camp + ".png";
			};

			if(url.indexOf("url(\"") == 0){
                image.src = url.slice(5, url.indexOf("\")"));
            }else if(url.indexOf("url('") == 0){
                image.src = url.slice(5, url.indexOf("\')"));
			}
			               		    		
		},




	};
});

