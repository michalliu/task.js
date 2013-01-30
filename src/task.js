function task() {
	if (!(this instanceof task)) {
		return new task();
	}
	this.todos=[];
	this.sleepTotal = 0;
}
task.prototype = {
	run: function (fn) {
		this.todos.push(fn);
		return this;
	},
	sleep: function (time) {
		this.sleepTotal += time;
		var worker = new Worker('/src/timer.js');
		var todos = this.todos;
		this.todos = [];
		worker.onmessage = function(event) {
			todos.forEach(function (todo) {
				todo();
			});
		};
		worker.postMessage(this.sleepTotal);
		return this;
	},
	done: function () {
		this.sleep(16)
	}
};
