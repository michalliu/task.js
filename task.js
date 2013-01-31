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
		var that = this;
		that.timeout += time;
		var timer = setTimeout(function () {
			var callbacks = that.todo[timer];
			callbacks.forEach(function (cb) {
				cb();
			});
		}, that.timeout);
		this.timer.push(timer);
		return this;
	},
	done: function () {
		this.timer = null;
		this.todo = null;
		this.timeout = null;
	}
};
