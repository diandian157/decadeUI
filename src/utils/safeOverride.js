/**
 * 在原始方法执行后追加逻辑
 */
export function wrapAfter(target, key, afterFn) {
	if (!target || typeof target[key] !== "function") return () => {};

	const original = target[key];
	target[key] = function (...args) {
		const result = original.apply(this, args);
		try {
			afterFn.call(this, result, ...args);
		} catch (e) {}
		return result;
	};
	target[key]._original = original;
	return () => {
		target[key] = original;
	};
}

/**
 * 在原始方法执行前插入逻辑
 */
export function wrapBefore(target, key, beforeFn) {
	if (!target || typeof target[key] !== "function") return () => {};

	const original = target[key];
	target[key] = function (...args) {
		try {
			beforeFn.call(this, ...args);
		} catch (e) {}
		return original.apply(this, args);
	};
	target[key]._original = original;
	return () => {
		target[key] = original;
	};
}

/**
 * 完全包装原始方法
 */
export function wrapAround(target, key, wrapperFn) {
	if (!target || typeof target[key] !== "function") return () => {};

	const original = target[key];
	target[key] = function (...args) {
		try {
			return wrapperFn.call(this, original, ...args);
		} catch (e) {
			return original.apply(this, args);
		}
	};
	target[key]._original = original;
	return () => {
		target[key] = original;
	};
}

/**
 * 批量还原覆写
 */
export function restoreAll(restoreFns) {
	restoreFns.forEach(fn => {
		try {
			fn();
		} catch (e) {}
	});
}
