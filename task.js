(function () {
	'use strict';
	function assertionError(message) {
		this.message = message;
		this.toString = function () {
			return "Assertion failed: " + this.message;
		};
	}

	function Task() {
		if (!(this instanceof Task)) {
			return new Task();
		}
		var undef;
		this.timer = [];
		this.todo = {};
		this.timeout = 0;
		this.lastResult = undef;
	}

	Task.prototype = {
		run: function (fn) {
			var lastTimer;
			if (this.timer.length <= 0) {
				this.lastResult = fn(this.lastResult);
			} else {
				lastTimer = this.timer[this.timer.length - 1];
				if (!this.todo[lastTimer]) {
					this.todo[lastTimer] = [];
				}
				this.todo[lastTimer].push(fn);
			}
			return this;
		},
		sleep: function (time) {
			if (typeof time === 'funtion') {
				time = time();
			}
			var that = this;
			that.timeout += time;
			var timer = setTimeout(function () {
				var callbacks = that.todo[timer];
				if(callbacks && callbacks.forEach) {
					callbacks.forEach(function (cb) {
						that.lastResult = cb(that.lastResult);
					});
				}
			}, that.timeout);
			this.timer.push(timer);
			return this;
		},
		assertEquals: function () {
			var fns = arguments;
			return this.assert(function (d) {
				var i=1,l=fns.length;
				var fn = fns[0];
				var lastVal;
				var val;
				if (typeof fn === "function") {
					lastVal = fn(d);
				} else {
					lastVal = fn;
				}
				for (;i<l;i++) {
					fn = fns[i];
					if (typeof fn === "function") {
						val = fn(d);
					} else {
						val = fn;
					}
					if (val !== lastVal) {
						fns = null;
						return [false, fn + " should " + (typeof fn === "function" ? "return ": "be ") + lastVal];
					}
				}
				fns = null;
				return [true, ""];
			});
		},
		assertNotEquals:function () {
			var fns = arguments;
			return this.assert(function (d) {
				var i=1,l=fns.length;
				var fn = fns[0];
				var lastVal;
				var val;
				if (typeof fn === "function") {
					lastVal = fn(d);
				} else {
					lastVal = fn;
				}
				for (;i<l;i++) {
					fn = fns[i];
					if (typeof fn === "function") {
						val = fn(d);
					} else {
						val = fn;
					}
					if (val === lastVal) {
						fns = null;
						return [false, fn + " should not " + (typeof fn === "function" ? "return ": "be ") + lastVal];
					}
				}
				fns = null;
				return [true, ""];
			});
		},
		assertFalse: function (fn) {
			return this.assert(function (d) {
				return [fn(d) === false, fn + " should " + (typeof fn === "function" ? "return ": "be ") + "false"];
			});
		},
		assertTrue: function (fn) {
			return this.assert(function (d) {
				return [fn(d) === true, fn + " should " + (typeof fn === "function" ? "return ": "be ") + "true"];
			});
		},
		assert: function (assertFn) {
			var that = this;
			if (typeof assertFn === "function"){
				this.sleep(0).run(function (d) {
					var result = assertFn(d);
					var ret = result[0];
					var statement = result[1];
					if (!ret) {
						if (task.onAssertionError) {
							try{
								assertionError.prototype = new Error();
								throw new assertionError(statement);
							} catch (ex) {
								task.onAssertionError(ex);
							}
						} else {
							if (window.console && console.assert) {
								console.assert(ret,statement);
							} else {
								throw new assertionError(statement);
							}
						}
						that.timer.forEach(function (timer) {
							clearTimeout(timer);
						});
					}
				}).sleep(0);
			}
			return this;
		}
	};
	window.task = Task;
}());
