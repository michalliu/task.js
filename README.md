task.js
=======
A beautiful way to control your task flow, simple and powerful. [Demo](http://michalliu.github.com/task.js/)

Usage
-----
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

By this tiny script `task.js`, you just need this

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
    
`sleep` method support function, you can generate timeout value dynamiclly

Instance method
----
1. **run(fn)**
    
    run function

    **params:**
    
    `fn` - the function to be executed, the value fn returned will be the parammeter of the next fn. so it is easy to break a complex operation to mutiple simple tasks using `task.js`
    
    **returns:**
    
    the task object itself
    
2. **sleep(time)**

    sleep some time
    
    **params:**
    
    `time` - the waiting time to perform the next operation. time can be a function or number, if time is function, it use the returned value as the waiting time,and it will try to convert return value to number, it's parameter is the return value from last "run" function. so, it is easily to dynamiclly generate the timeout value according to the result of last opteration.

    **returns:**
    
    the task object itself
    
3. **assertEquals([fn,fn,...])**
    
    assert parammeters or it's return value is equal

    **params:**
    
    `fn` - the function to be executed. it's parameter is the return value from last "run" function.
    
    **returns:**
    
    the task object itself
    
4. **assertNotEquals([fn,fn,...])**

    assert parammeters or it's return value isn't equal

    **params:**
    
    `fn` - the function to be executed. it's parameter is the return value from last "run" function.
    
    **returns:**
    
    the task object itself
    
5. **assertFalse(fn)**

    assert parammeters or it's return value is false

    **params:**
    
    `fn` - the function to be executed. it's parameter is the return value from last "run" function.
    
    **returns:**
    
    the task object itself
    
6. **assertTrue(fn)**

    assert parammeters or it's return value is true

    **params:**
    
    `fn` - the function to be executed. it's parameter is the return value from last "run" function.
    
    **returns:**
    
    the task object itself

Static method
----

**onAssertionFail**

Hook the assertion fail event
    
    task.onAssertionFail = function (err) {
        // err object contains error info
        // or you can just throw it
        throw err;
    }

What will happen if assertion failed?
----

it follows the following routine

1. if `onAssertionFail` is defined, just let `onAssertionFail` handle it
2. if `window` has `console` object, and console has assert method, let `window.console` handle it
3. if no handlers, just throw an `AssertionFail` error
4. stop the rest tasks
