/*jshint browser:true*/
/*global console*/
;(function () {
	"use strict";

	var todoFlag = "todo",
		timerFlag = "timer";

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
		this.queue = []; // event queue
		this.timer = []; // store timers
		this.timeout = 0; // timeout recorder
		this.todo = {}; // todo list
	}

	Task.prototype = {
		run: function (fn) { // put to run queue
			this.queue.push(todoFlag);
			this.queue.push(fn);
			return this;
		},
		sleep: function (time) { // put to sleep queue
			this.queue.push(timerFlag);
			this.queue.push(time);
			return this;
		},
		_run: function (fn) { // actually run
			var lastTimer;
			if (isFunction(fn)) {
				if (this.timer.length <= 0) {
					this._sleep(0); // generate a timer
					this._run(fn); // don't push to queue again
				} else {
					lastTimer = this.timer[this.timer.length - 1];
					if (!this.todo[lastTimer]) {
						this.todo[lastTimer] = [];
					}
					this.todo[lastTimer].push(fn);
				}
			}
		},
		_sleep: function (time) { // actually sleep
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
				this.sleep(0);
				this.run(function (d) {
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
				});
				this.sleep(0);
			}
			return this;
		},
		// set max repeat times
		repeat: function (times) {
			this._maxRepeat = times;
			return this;
		},
		// start run queue
		start: function () {
			var q = this.queue;
			var one;
			var fn;
			var currentRepeat = 1;
			var onProgress = this._onProgress;
			var maxRepeat = this._maxRepeat || 1;

			function progressEmitter(x, y) {
				return function (arg) {
					onProgress(x, y, maxRepeat);
					// this function must return the arg not altered
					// to support the return value passing mechanism
					return arg;
				};
			}

			do{
				for (var i=0,step=0;i<q.length;i+=2) {
					one = q[i];
					if (one === todoFlag) {
						fn = q[i+1];
						this._run(fn);
						// insert a function to emit a progress event
						if (onProgress && isFunction(onProgress)) {
							this._run(progressEmitter(step++, currentRepeat));
						}
					} else if (one === timerFlag) {
						fn = q[i+1];
						this._sleep(fn);
					}
				}
				this._sleep(0); // start over
			} while(++currentRepeat <= maxRepeat);
			if(this._onDone) {
				this._run(this._onDone);
			}
		},
		progress: function (fn) {
			if (isFunction(fn)) {
				this._onProgress = fn;
			}
			return this;
		},
		done: function (fn) {
			if (isFunction(fn)) {
				this._onDone = fn;
			}
			return this;
		}
	};

	window.task = Task;
}());
