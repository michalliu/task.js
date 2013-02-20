/*jshint browser:true*/
/*global console*/
(function () {
	"use strict";
	function AssertionFail(message) {
		this.message = message;
		this.toString = function () {
			return "Assertion failed: " + this.message;
		};
	}

	function isFunction(fn) {
		return typeof fn === "function";
	}

	function Task() {
		if (!(this instanceof Task)) {
			return new Task();
		}
		var undef;
		this.timer = []; // timer list
		this.todo = {}; // todo list, the key is timer
		this.timeout = 0; // current timeout value
		this.lastResult = undef; // last value returned from function
	}

	Task.prototype = {
		run: function (fn) {
			var lastTimer;
			if (isFunction(fn)) {
				if (this.timer.length <= 0) {
					this.lastResult = fn(this.lastResult);
				} else {
					lastTimer = this.timer[this.timer.length - 1];
					if (!this.todo[lastTimer]) {
						this.todo[lastTimer] = [];
					}
					this.todo[lastTimer].push(fn);
				}
			}
			return this;
		},
		sleep: function (time) {
			if (isFunction(time)) {
				time = time(this.lastResult);
				if (typeof time !== "number") { // parse time to number
					time = parseInt(time, 10);
				}
				if (isNaN(time)) { // we expect a number
					time = 0;
				}
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
				if (isFunction(fn)) {
					lastVal = fn(d);
				} else {
					lastVal = fn;
				}
				for (;i<l;i++) {
					fn = fns[i];
					if (isFunction(fn)) {
						val = fn(d);
					} else {
						val = fn;
					}
					if (val !== lastVal) {
						fns = null;
						return [false, fn + " should " + (isFunction(fn) ? "return ": "be ") + lastVal];
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
				if (isFunction(fn)) {
					lastVal = fn(d);
				} else {
					lastVal = fn;
				}
				for (;i<l;i++) {
					fn = fns[i];
					if (isFunction(fn)) {
						val = fn(d);
					} else {
						val = fn;
					}
					if (val === lastVal) {
						fns = null;
						return [false, fn + " should not " + (isFunction(fn) ? "return ": "be ") + lastVal];
					}
				}
				fns = null;
				return [true, ""];
			});
		},
		assertFalse: function (fn) {
			return this.assert(function (d) {
				var ret;
				if (isFunction(fn)) {
					ret = fn(d);
				} else {
					ret = fn;
				}
				return [ret === false, fn + " should " + (isFunction(fn) ? "return ": "be ") + "false"];
			});
		},
		assertTrue: function (fn) {
			return this.assert(function (d) {
				var ret;
				if (isFunction(fn)) {
					ret = fn(d);
				} else {
					ret = fn;
				}
				return [ret === true, fn + " should " + (isFunction(fn) ? "return ": "be ") + "true"];
			});
		},
		assert: function (assertFn) {
			var that = this;
			if (isFunction(assertFn)){
				this.sleep(0).run(function (d) {
					var result = assertFn(d);
					var ret = result[0]; // assert success or not
					var statement = result[1]; // tips message
					if (!ret) { // assertion failed
						if (Task.onAssertionFail) { // has assertion error handler
							try{
								AssertionFail.prototype = new Error(); // generate error stack
								throw new AssertionFail(statement);
							} catch (ex) {
								Task.onAssertionFail(ex); // let execption handler handle it
							}
						} else {
							if (window.console && console.assert) {
								console.assert(ret,statement);// let console handles it
							} else {
								throw new AssertionFail(statement); // or throw it
							}
						}
						that.timer.forEach(function (timer) {
							clearTimeout(timer); // stop the timer associate with functions not yet executed
						});
					}
				}).sleep(0);
			}
			return this;
		}
	};
	window.task = Task;
}());
