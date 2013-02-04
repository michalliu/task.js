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
		assert: function (assertFn) {
			var that = this;
			var timers;
			if (typeof assertFn === "function"){
				this.sleep(0).run(function (d) {
					var ret = assertFn(d);
					var statement = assertFn.toString();
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
						timers = that.timer.forEach(function (timer) {
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
