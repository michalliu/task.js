/*jshint browser:true*/
/*global asyncTest,start,ok,equal,deepEqual,task*/
function now() {
	return new Date().getTime();
}

var timePrecision = 20;

asyncTest("run method", 1, function () {
	task().run(function () {
		ok(true, "function executed");
	}).done(function () {
		start();
	}).start();
});

asyncTest("mutiple run method", 3, function () {
	task().run(function () {
		ok(true, "function executed");
	}).run(function () {
		ok(true, "function executed");
	}).sleep(1000).run(function () {
		ok(true, "function executed");
	}).done(function () {
		start();
	}).start();
});

asyncTest("sleep method", 2, function () {
	var begin = now();
	task().sleep(1000).run(function () {
		ok(true, "function executed");
	}).done(function () {
		var diff = now() - begin;
		ok((diff - 1000) <= timePrecision, "sleeped 1s, " + diff);
		start();
	}).start();
});

asyncTest("mutiple sleep method", 3, function () {
	var begin = now();
	task().sleep(1000).run(function () {
		ok(true, "function executed");
	}).sleep(1000).run(function () {
		ok(true, "function executed");
	}).done(function () {
		var diff = now() - begin;
		ok((diff - 2000) < timePrecision, "sleeped 2s, " + diff);
		start();
	}).start();
});

asyncTest("return value passing", 2, function () {
	var a={};
	task().run(function () {
		ok(true, "function executed");
		return a;
	}).sleep(500).done(function (d) {
		equal(a, d, "return value passed");
		start();
	}).start();
});

asyncTest("repeat method", 3, function () {
	task().run(function () {
		ok(true, "function executed");
	}).repeat(3).done(function () {
		start();
	}).start();
});

asyncTest("repeat with sleep", 13, function () {
	var begin = now();
	task().run(function () {
		var diff = now()-begin;
		ok(true, "function executed");
		ok(diff,"after " + diff + "ms");
		return 100;
	}).sleep(500).run(function (d) {
		var diff = now()-begin;
		equal(d,100,"return value passed");
		ok(diff,"after " + diff + "ms");
	}).sleep(1000).repeat(3).done(function () {
		var diff = now()-begin;
		ok((diff - 4500) < timePrecision, "total used 4.5s, " + diff);
		start();
	}).start();
});

asyncTest("repeat with assertion", 3, function () {
	var a=0;
	var begin = now();
	var t=0;
	task().run(function () {
		a += 100;
		t++;
		return a;
	}).assertTrue(function () {
		return (t * 100) === a; // this should be true everytime
	}).sleep(1000).repeat(3).done(function () {
		var diff = now()-begin;
		ok((diff - 3000) < timePrecision, "sleeped 3s total, " + diff);
		ok(true, "no assertion error happened");
		equal(a, 300, "repeat 3 times total");
		start();
	}).start();
});

asyncTest("progress method", 2, function () {
	var a=0;
	var progressResultExcepted = [0,1,3,1,1,3,0,2,3,1,2,3,0,3,3,1,3,3];
	var progressResultActual=[];
	task().run(function () {
		a += 100;
		return a;
	}).sleep(50).run(function (d) {
		// do nothing
		return d;
	}).repeat(3).progress(function (step,currentRepeat,maxRepeat) {
		progressResultActual=progressResultActual.concat([step,currentRepeat,maxRepeat]);
	}).done(function () {
		deepEqual(progressResultActual,progressResultExcepted,"progress event generate properly");
		equal(a, 300, "repeat 3 times");
		start();
	}).start();
});

asyncTest("progress with assertion", 2, function () {
	var a=0;
	var progressResultExcepted = [0,1,3,1,1,3,2,1,3,0,2,3,1,2,3,2,2,3,0,3,3,1,3,3,2,3,3];
	var progressResultActual=[];
	task().run(function () {
		a += 100;
		return a;
	}).sleep(50).run(function (d) {
		// do nothing
		return d;
	}).assertTrue(function (e) {
		return a===e;
	}).repeat(3).progress(function (step,currentRepeat,maxRepeat) {
		progressResultActual=progressResultActual.concat([step,currentRepeat,maxRepeat]);
	}).done(function () {
		deepEqual(progressResultActual,progressResultExcepted,"progress event generate properly");
		ok(true, "no assertion error");
		start();
	}).start();
});

asyncTest("assertion success", 2, function () {
	var a=0;
	task().run(function () {
		a=100;
	}).sleep(1000).assertTrue(function () {
		// pass a is 100
		ok(true, "assertion running");
		return a===100;
	}).done(function () {
		ok(true, "assertion pass");
		start();
	}).start();
});

asyncTest("asserttion fail(died queue)", 1, function () {
	var a=0;
	task.onAssertionFail = function (ex) {
		ok(ex,ex + "raised, queue stoped");
		start();
	};
	task().run(function () {
		a=100;
	}).sleep(1000).assertTrue(function () {
		return a!==100;
	}).done(function () {
		// done never be called if assertion error
		ok(true,"function executed"); // this shouldn't run
	}).start();
});

asyncTest("done method", 3, function () {
	task().run(function () {
		ok(true,"function executed"); // this should run 3 times
	}).sleep(1000).repeat(3).done(function () {
		start();
	}).start();
});

asyncTest("interrupt method", 3, function () {
	task.onAssertionFail = function (ex) {
		ok(ex,ex);
	};
	task().run(function () {
		ok(true,"function executed"); // this should run 3 times
	}).sleep(1000).assertTrue(function () {
		return false;
	}).sleep(100).interrupt(function () {
		ok(true,"interrupted"); // this should run
		start();
	}).done(function () {
		ok(false,"done shouldn't executed"); // this shouldn't run
		start();
	}).protect().start();
});

asyncTest("protect method", 3, function () {
	task.onAssertionFail = function (ex) {
		ok(ex,ex);
	};
	task().protect().run(function () {
		ok(true,"function executed"); // this should run 3 times
	}).sleep(1000).assertTrue(function () {
		return false;
	}).sleep(100).interrupt(function () {
		ok(true, "interrupt executed");
		start();
	}).done(function () {
		ok(false,"done shoun't execute"); // this shouldn't run
		start();
	}).start();
});

asyncTest("unprotect method", 3, function () {
	task.onAssertionFail = function (ex) {
		ok(ex,ex);
	};
	task().unprotect().run(function () {
		ok(true,"function executed"); // this should run 3 times
	}).sleep(1000).assertTrue(function () {
		return false;
	}).interrupt(function () {
		ok(false, "interrupt will never run");
		start();
	}).done(function () {
		ok(true, "done runned");
		start(); // this will never executed,only if unprotected
	}).start();
});

asyncTest("1 add to 100", function () {
	var i=1;
	var result = 0;
	task().run(function () {
		result = result + i;
		i = i + 1;
	}).repeat(100).done(function () {
		equal(result,5050, "result is 5050");
		start();
	}).start();
});
