task.js
=======
A beautiful way to control your task flow. [Demo](http://michalliu.github.com/task.js/)

Usage
=====
Think of the following code

    setTimeout(function () {
        // do something
        setTimeout(function () {
            // do something
            setTimeout(function () {
                // do something
                setTimeout(function () {
                    // do something
                    setTimeout(function () {
                      // do something
                    },1000)
                },1000)
            },1000)
        },1000)
    },1000);

By this tiny script task.js, you just need this

    task()
    .sleep(1000)
    .run(function () {})
    .sleep(1000)
    .run(function () {})
    .sleep(1000)
    .run(function () {})
    .sleep(1000)
    .run(function () {})
    .sleep(1000)
    .run(function () {})
