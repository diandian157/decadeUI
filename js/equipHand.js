"use strict";
decadeModule.import((lib, game, ui, get, ai, _status) => {
	function createEquipCardCopy(originalCard) {
		const card = ui.create.card(ui.special);
		card.init([originalCard.suit, originalCard.number, originalCard.name, originalCard.nature]);
		card.cardid = originalCard.cardid;
		card.wunature = originalCard.wunature;
		card.storage = originalCard.storage;
		card.relatedCard = originalCard;
		card.owner = get.owner(originalCard);
		const observer = new MutationObserver(mutations => {
			if (get.position(card) === "s" && card.hasGaintag("equipHand")) {
				for (const m of mutations) {
					if (m.attributeName === "class") {
						ui.selected.cards.remove(card);
						if (card.classList.contains("selected")) {
							card.updateTransform(true, 0);
							card.relatedCard.classList.add("selected");
							ui.selected.cards.add(card.relatedCard);
						} else {
							card.updateTransform(false, 0);
							card.relatedCard.classList.remove("selected");
							ui.selected.cards.remove(card.relatedCard);
						}
					}
				}
			}
		});
		observer.observe(card, { attributes: true, attributeFilter: ["class"] });
		return card;
	}
	ui.create.cardChooseAll = function () {
		const event = get.event();
		if (!event.isMine() || !event.allowChooseAll || event.complexCard || event.complexSelect || !lib.config.choose_all_button) return null;
		const selectCard = event.selectCard;
		const range = get.select(selectCard);
		if (range[1] <= 1) return null;
		return (event.cardChooseAll = ui.create.control("全选", () => {
			const event2 = get.event();
			const player = event2.player;
			const selecteds = [...ui.selected.cards].map(card => player.getCards("s", i => i.relatedCard === card)[0] || card);
			ui.selected.cards.length = 0;
			game.check();
			let selectables = get.selectableCards();
			if (lib.config["extension_十周年UI_aloneEquip"]) {
				const equipSelectables = player.getCards("e").filter(card => card.classList.contains("selectable") && card.classList.contains("equip-card-selectable"));
				selectables = selectables.concat(equipSelectables);
			}
			const cards = selecteds.length ? [...new Set(selectables).difference(selecteds)] : selectables;
			if (cards.length <= range[1]) ui.selected.cards.push(...cards);
			else ui.selected.cards.push(...cards.randomGets(range[1]));
			for (const card of ui.selected.cards) {
				card.classList.add("selected");
				card.updateTransform(true, 0);
			}
			for (const card of selecteds) {
				card.classList.remove("selected");
				card.updateTransform(false, 0);
			}
			game.check();
			if (typeof event2.custom?.add?.card === "function") _status.event.custom.add.card();
		}));
	};
	function createFilterCard(originalFilter, includeS) {
		return (card, player, target) => {
			const relatedCard = card.relatedCard || card;
			if (get.position(card) === "e") return false;
			if (includeS && get.position(card) === "s" && get.itemtype(card) === "card" && !card.hasGaintag("equipHand")) return false;
			return originalFilter(relatedCard, player, target);
		};
	}
	function processCardSelection(event, player, cardx, cardxF, cardxF2) {
		const hasFilter = !!event.filterCard;
		const isMultiSelect = typeof event.selectCard === "object" || event.selectCard > 1;
		if (hasFilter) {
			if (isMultiSelect) {
				cardxF2.addArray(cardxF);
				for (const cardF of player.getCards("he", j => {
					const relatedCard = j.relatedCard || j;
					return event.position.includes(get.position(relatedCard)) && event.filterCard(relatedCard, player, event.target);
				})) {
					if (!ui.selected.cards) ui.selected.cards = [];
					ui.selected.cards.add(cardF);
					cardxF2.addArray(
						cardx.filter(j => {
							if (cardxF2.includes(j)) return false;
							const relatedCard = j.relatedCard || j;
							return event.position.includes(get.position(relatedCard)) && event.filterCard(relatedCard, player, event.target);
						})
					);
					ui.selected.cards.remove(cardF);
				}
			}
		}
		const cardsToGive = isMultiSelect ? cardxF2 : hasFilter ? cardxF : cardx;
		if (cardsToGive.length) player.directgains(cardsToGive, null, "equipHand");
	}
	function setupCardStyles(cards) {
		cards.forEach(card => {
			card.node.gaintag.classList.remove("gaintag", "info");
			card.node.gaintag.innerHTML = '<div class="epclick"></div>';
		});
	}
	function sortCards(cards) {
		cards.sort((b, a) => {
			if (a.name !== b.name) return lib.sort.card(a.name, b.name);
			if (a.suit !== b.suit) return lib.suit.indexOf(a) - lib.suit.indexOf(b);
			return a.number - b.number;
		});
	}
	lib.hooks.checkBegin.add(async event => {
		if (lib.config["extension_十周年UI_aloneEquip"]) return;
		const player = event.player;
		const isValidEvent = event.position && typeof event.position === "string" && event.position.includes("e") && player.countCards("e") && !event.copyCards && ["chooseCard", "chooseToUse", "chooseToRespond", "chooseToDiscard", "chooseCardTarget", "chooseToGive"].includes(event.name);
		if (!isValidEvent) return;
		event.copyCards = true;
		const includeS = !event.position.includes("s");
		if (includeS) event.position += "s";
		let eventFilterCard;
		if (event.filterCard) eventFilterCard = createFilterCard(event.filterCard, includeS);
		const originalCards = player.getCards("e");
		const cardx = originalCards.map(createEquipCardCopy);
		let cardxF = [];
		let cardxF2 = [];
		if (event.filterCard) {
			cardxF = cardx.filter(card => {
				const relatedCard = card.relatedCard || card;
				return event.filterCard(relatedCard, player, event.target);
			});
		}
		processCardSelection(event, player, cardx, cardxF, cardxF2);
		if (eventFilterCard) event.filterCard = eventFilterCard;
		const allCards = [...cardx, ...cardxF, ...cardxF2];
		setupCardStyles(allCards);
		sortCards(cardx);
	});
	function cleanupEquipCards(event, player) {
		const cards = event.result?.cards;
		if (cards) {
			cards.forEach((card, index) => {
				if (card.hasGaintag("equipHand")) {
					const originalCard = player.getCards("e", c => c.cardid === card.cardid)[0];
					if (originalCard) cards[index] = originalCard;
				}
			});
		}
		if (player) {
			player
				.getCards("s", card => card.hasGaintag("equipHand"))
				.forEach(card => {
					card.discard();
					card.delete();
				});
		}
		event.copyCards = false;
		if (player === game.me) ui.updatehl();
	}
	lib.hooks.uncheckBegin.add(async (event, args) => {
		const player = event.player;
		const shouldCleanup = args.includes("card") && event.copyCards && (event.result || (["chooseToUse", "chooseToRespond"].includes(event.name) && !event.skill && !event.result));
		if (lib.config["extension_十周年UI_aloneEquip"] || shouldCleanup) cleanupEquipCards(event, player);
	});
	lib.hooks.checkCard.add((card, event) => {
		if (lib.config["extension_十周年UI_aloneEquip"] || !event.copyCards) return;
		if (get.position(card) === "e" && card.classList.contains("selected")) {
			const equipHandCopy = event.player.getCards("s", c => c.hasGaintag("equipHand") && c.relatedCard === card)[0];
			if (equipHandCopy && !equipHandCopy.classList.contains("selected")) {
				card.classList.remove("selected");
				ui.selected.cards.remove(card);
			}
		}
	});
	lib.hooks.checkEnd.add(function (event) {
		if (lib.config["extension_十周年UI_aloneEquip"] || !event.copyCards) return;
		const player = event.player;
		const equipCards = player.getCards("e");
		for (const equipCard of equipCards) {
			if (equipCard.classList.contains("selected")) {
				const equipHandCopy = player.getCards("s", c => c.hasGaintag("equipHand") && c.relatedCard === equipCard)[0];
				if (equipHandCopy && !equipHandCopy.classList.contains("selected")) {
					equipCard.classList.remove("selected");
					ui.selected.cards.remove(equipCard);
				}
			}
		}
	});

	function getEquipUsableSkills(event, player) {
		if (!event._skillChoice) return [];
		const ownedlist = game.expandSkills(player.getSkills("invisible", false));
		return event._skillChoice.filter(skill => !ownedlist.includes(skill) && !lib.skill.global.includes(skill));
	}

	function getCardSkills(card) {
		const info = get.info(card);
		return info?.skills ? game.expandSkills(info.skills.slice()) : [];
	}

	function handleEquipClick(e, skill) {
		e.stopImmediatePropagation();
		e.preventDefault();
		if (e.type === "touchstart") {
			e.target._equipTouchHandled = true;
		}
		ui.click.skill(skill);
	}

	function addEquipClickListener(card, handler) {
		if (lib.config.touchscreen) {
			card.addEventListener("touchstart", handler, true);
		} else {
			card.addEventListener("click", handler, true);
		}
	}

	function removeEquipClickListener(card, handler) {
		if (lib.config.touchscreen) {
			card.removeEventListener("touchstart", handler, true);
		} else {
			card.removeEventListener("click", handler, true);
		}
	}

	function showSkillSelector(e, skills) {
		e.stopImmediatePropagation();
		e.preventDefault();
		if (ui._equipSkillDialog) {
			ui._equipSkillDialog.close();
			delete ui._equipSkillDialog;
		}
		const dialog = ui.create.dialog("选择要发动的技能", "hidden");
		ui._equipSkillDialog = dialog;
		for (const skill of skills) {
			const item = dialog.add('<div class="popup text pointerdiv" style="width:calc(100% - 10px);display:inline-block">' + get.skillTranslation(skill, game.me, true) + "</div>");
			item.firstChild.link = skill;
			item.firstChild.addEventListener(lib.config.touchscreen ? "touchend" : "click", function (ev) {
				ev.stopPropagation();
				dialog.close();
				delete ui._equipSkillDialog;
				ui.click.skill(this.link);
			});
		}
		dialog.forcebutton = true;
		dialog.classList.add("forcebutton");
		dialog.open();
	}

	function clearEquipSelectable() {
		if (!game.me) return;
		const equipCards = game.me.getCards("e");
		for (const card of equipCards) {
			card.classList.remove("selectable");
			card.classList.remove("equip-card-selectable");
			delete card._equipSkills;
			if (card._equipClickHandler) {
				removeEquipClickListener(card, card._equipClickHandler);
				delete card._equipClickHandler;
			}
		}
	}

	function setupEquipCardSelection(event, player) {
		if (!event.position || typeof event.position !== "string" || !event.position.includes("e")) return;
		if (!event.filterCard) return;
		const equipCards = player.getCards("e");
		for (const card of equipCards) {
			if (event.filterCard(card, player, event.target)) {
				card.classList.add("selectable");
				card.classList.add("equip-card-selectable");
			}
		}
	}

	lib.hooks.checkEnd.add(function (event) {
		if (!lib.config["extension_十周年UI_aloneEquip"]) return;
		const player = event.player;
		if (player !== game.me) return;
		if (!event.isMine?.()) return;

		const equipCards = player.getCards("e");
		if (!equipCards.length) return;

		if (event.skill) {
			clearEquipSelectable();
			setupEquipCardSelection(event, player);
			return;
		}

		if (!get.noSelected()) {
			clearEquipSelectable();
			setupEquipCardSelection(event, player);
			return;
		}

		const usableSkills = getEquipUsableSkills(event, player);
		if (!usableSkills.length) {
			clearEquipSelectable();
			return;
		}
		for (const card of equipCards) {
			const cardSkills = getCardSkills(card);
			const matchedSkills = cardSkills.filter(s => usableSkills.includes(s));
			if (matchedSkills.length) {
				card.classList.add("selectable");
				card._equipSkills = matchedSkills;
				if (card._equipClickHandler) {
					removeEquipClickListener(card, card._equipClickHandler);
				}
				card._equipClickHandler = e => {
					if (!card._equipSkills?.length || !card.classList.contains("selectable")) return;
					if (card._equipSkills.length === 1) {
						handleEquipClick(e, card._equipSkills[0]);
					} else {
						showSkillSelector(e, card._equipSkills);
					}
				};
				addEquipClickListener(card, card._equipClickHandler);
			} else {
				card.classList.remove("selectable");
				if (card._equipClickHandler) {
					removeEquipClickListener(card, card._equipClickHandler);
					delete card._equipClickHandler;
				}
				delete card._equipSkills;
			}
		}
	});

	lib.hooks.uncheckBegin.add(function () {
		if (!lib.config["extension_十周年UI_aloneEquip"]) return;
		if (ui._equipSkillDialog) {
			ui._equipSkillDialog.close();
			delete ui._equipSkillDialog;
		}
		clearEquipSelectable();
	});
});
