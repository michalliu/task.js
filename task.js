/*jshint browser:true*/
/*global console*/
;(function () {
	"use strict";

	var todoFlag = "todo", // flag to mark the nextsibling is a todo(function)
		timerFlag = "timer";// flag to mark the nextsibling is a timer(function)

	// assertion fail error object
	function AssertionFail(message) {
		this.message = message;
		this.toString = function () {
			return "Assertion failed: " + this.message;
		};
	}

	// check if function
	function isFunction(fn) {
		return typeof fn === "function";
	}

	// the task constructor
	function Task() {
		if (!(this instanceof Task)) {
			return new Task();
		}
		this.queue = []; // the original event queue
		this.timer = []; // store all the timers
		this.timeout = 0; // timeout total
		this.protective = true; // protect the queue
		this.todo = {}; // a map record the timer and it's callbacks
	}

	// prototype
	Task.prototype = {
		// put something to run queue
		run: function (fn) {
			this.queue.push(todoFlag);
			this.queue.push(fn);
			return this;
		},
		// put something to sleep queque, time or time generator
		sleep: function (time) {
			this.queue.push(timerFlag);
			this.queue.push(time);
			return this;
		},
		// the actual run method
		// if no timer set then set a timer(0ms delay), then bind the rest
		// "run" function to that timer
		// if timer already set, just bind the function to that
		// timer
		_run: function (fn) {
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
		// the actual sleep method
		// 1. if time is a function rather than number, execute it, use the return value
		// as the delaying time
		// 2. the time always added the last time
		// 3. generate a timer, push to timer queque, the callback function will execute
		// any function which binded to that timer
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
			var timer;
			// determin timeout total
			that.timeout += time;
			// generate timer
			timer = setTimeout(function () {
				// retrieve "run" functions assoicate with timer
				var callbacks = that.todo[timer];
				// must be an array
				if(callbacks && callbacks.forEach) {
					callbacks.forEach(function (cb) {
						// record the last result returned by the "run" function
						that.lastResult = cb(that.lastResult);
					});
				}
			}, that.timeout);
			// store timer
			this.timer.push(timer);
		},
		assertEquals: function () {
			var fns = arguments;
			return this._assert(function (d) {
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
				return [true, ""]; // assertion result, message
			});
		},
		assertNotEquals:function () {
			var fns = arguments;
			return this._assert(function (d) {
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
			return this._assert(function (d) {
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
			return this._assert(function (d) {
				var ret;
				if (isFunction(fn)) {
					ret = fn(d);
				} else {
					ret = fn;
				}
				return [ret === true, fn + " should " + (isFunction(fn) ? "return ": "be ") + "true"];
			});
		},
		_assert: function (assertFn) {
			var that = this;
			if (isFunction(assertFn)){
				this.sleep(0).run(function (d) {
					var result = assertFn(d); // run assertion
					var ret = result[0]; // determin assert result
					var statement = result[1]; // tips message
					if (!ret) { // assertion failed
						// stop the timer associate with functions not yet executed
						if (that.protective) {
							if (that._onInterrupt) { // trigger interrupt event
								that._onInterrupt(statement);
							}
							that.timer.forEach(function (timer) {
								clearTimeout(timer);
							});
						}
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
								if (that.protective && that._onInterrupt) { // trigger interrupt event
									that._onInterrupt(statement);
								}
								throw new AssertionFail(statement); // or throw it
							}
						}
					}
				}).sleep(0); // make sure assertion is running on a stand alone context
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
			var currentRepeat = 1; // current repeat
			var onProgress = this._onProgress;
			var maxRepeat = this._maxRepeat || 1; // the total repeat count
			var maxOps = 0; // the total operations count

			function progressEmitter(cOps, cRepeat) {
				return function (arg) {
					onProgress(cOps, maxOps, cRepeat, maxRepeat);
					// this function must return the arg not altered
					// to support the return value passing mechanism
					return arg;
				};
			}

			do{
				for (var i=0,step=0;i<q.length;i+=2) {
					one = q[i];
					if (one === todoFlag) { // next one is todo function
						fn = q[i+1];
						this._run(fn);
						// insert a function to emit a progress event
						// but not in the original running queque
						// it's much more like a ghost
						if (onProgress && isFunction(onProgress)) {
							this._run(progressEmitter(++step, currentRepeat));
						}
						if (currentRepeat === 1) {
							maxOps++; // increase the total operations count
						}
					} else if (one === timerFlag) { // next one is a timer(generator)
						fn = q[i+1];
						this._sleep(fn);
					}
				}
				this._sleep(0); // start over, run queque again, no delay
			} while(++currentRepeat <= maxRepeat);
			if(this._onDone) { // trigger done event
				this._run(this._onDone);
			}
		},
		// set progress callback
		progress: function (fn) {
			if (isFunction(fn)) {
				this._onProgress = fn;
			}
			return this;
		},
		interrupt: function (fn) {
			if (isFunction(fn)) {
				this._onInterrupt = fn;
			}
			return this;
		},
		// set done callback
		done: function (fn) {
			if (isFunction(fn)) {
				this._onDone = fn;
			}
			return this;
		},
		// if protect the queue, if first assertionError happend
		// the queue will stoped to execute, this is the default action
		protect: function () {
			this.protective = true;
			return this;
		},
		// if unprotect the queue, if first assertionError happend
		// the queue will continue to execute, which may cause unexpected
		// result
		unprotect: function () {
			this.protective = false;
			return this;
		}
	};

	window.task = Task;
}());
