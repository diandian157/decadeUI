/**
 * @fileoverview Event覆写模块 - lib.element.event的扩展方法
 */
import { lib, game, ui, get, ai, _status } from "noname";

/**
 * event.addMessageHook - 添加消息钩子
 * @param {string} message - 消息名称
 * @param {Function} callback - 回调函数
 */
export function eventAddMessageHook(message, callback) {
	if (this._messages === undefined) this._messages = {};
	message = message.toLowerCase();
	if (this._messages[message] === undefined) this._messages[message] = [];
	this._messages[message].push(callback);
}

/**
 * event.triggerMessage - 触发消息
 * @param {string} message - 消息名称
 */
export function eventTriggerMessage(message) {
	if (this._messages === undefined) return;
	message = message.toLowerCase();
	if (this._messages[message] === undefined) return;

	const callbacks = this._messages[message];
	for (let i = 0; i < callbacks.length; i++) {
		if (typeof callbacks[i] === "function") {
			callbacks[i].call(this);
		}
	}
	this._messages[message] = [];
}

/**
 * 应用event扩展
 */
export function applyEventExtensions() {
	lib.element.event.addMessageHook = eventAddMessageHook;
	lib.element.event.triggerMessage = eventTriggerMessage;
}
