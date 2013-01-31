function task() {
	if(!(this instanceof task)) {
		return new task();
	}
	this.timer=[];
	this.todo={};
	this.timeout=0;
}
task.prototype = {
	run: function (fn) {
		var lastTimer;
		if (this.timer.length <= 0) {
			fn();
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
			var start = Date.now();
			var delay;
			callbacks.forEach(function (cb) {
				cb();
			});
			delay = Date.now() - start;
			that.timeout += delay;
		}, that.timeout);
		this.timer.push(timer);
		return this;
	}
};
