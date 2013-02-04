(function () {
	'use strict';
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
				callbacks.forEach(function (cb) {
					that.lastResult = cb(that.lastResult);
				});
			}, that.timeout);
			this.timer.push(timer);
			return this;
		}
	};
	window.task = Task;
}());
