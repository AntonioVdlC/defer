# defer

[![version](https://img.shields.io/npm/v/@antoniovdlc/defer.svg)](http://npm.im/@antoniovdlc/defer)
[![issues](https://img.shields.io/github/issues-raw/antoniovdlc/defer.svg)](https://github.com/AntonioVdlC/defer/issues)
[![downloads](https://img.shields.io/npm/dt/@antoniovdlc/defer.svg)](http://npm.im/@antoniovdlc/defer)
[![license](https://img.shields.io/npm/l/@antoniovdlc/defer.svg)](http://opensource.org/licenses/MIT)

Go-like defer functions in JavaScript.

## Installation

This package is distributed via npm:

```
npm install @antoniovdlc/defer
```

## Motivation

Go provides the very interesting concept of `defer`ing functions until the end of a function's execution.

```go
package main

import "fmt"

func main() {
  defer fmt.Println("world")

  fmt.Println("hello")
}

// hello 
// world
```

Such built-in construct might be very useful in JavaScript for example, where we sometimes need to do some clean-up, and thus could potentially co-locate it with the instanciation.

## Usage

You can use this library either as an ES module or a CommonJS package:
```js
import { defer, deferrable } from "@antoniovdlc/defer";
```
*- or -*
```js
const { defer, deferrable } = require("@antoniovdlc/defer");
```

### defer(fn: Function, caller: Function) : void

`defer` takes a function as argument, which will be called at the end of the execution of the caller function, and a caller function.

For sync functions, `defer` simply puts the `fn` on the call stack using `setTimeout(fn, 0)`.
For async functions, it is a bit more tricky, and we keep track of deferred functions within the `caller` itself, via the property `__$_deferArr`.
> Using `defer` in async functions requires them to be wrapper with `deferrable` to work properly.

### deferrable(fn: Function) : Function

`defer` works out of the box within sync functions. Unfortunately, for async functions, we need to use a wrapper: `deferrable`.
This wrapper returns a function that will compute similarly to its argument, but helps keep track of all the deferred functions within it.

`defer`red functions are run sequentially, and as such, if one function throws an error, the following `defer`red functions won't run.

`defer`red functions in a `deferrable` will not run if the wrapped function throws an error. 


## Examples

Let's start with a simple translation of the Go code we shared previously:
```js
function main() {
  defer(() => console.log("world"), main);
  console.log("hello");
}

main(); // hello world
```

There can be as many `defer` calls in a function as you'd like:
```js
function f() {
  defer(() => console.log("1"), f);
  console.log("2");
  defer(() => console.log("3"), f);
  console.log("4");
}

f(); // 2 4 1 3
```

For async functions, we need to use `deferrable`:
```js
const f = deferrable(async function fn() {
  defer(async() => await new Promise(     
    resolve => resolve(console.log("1"))
  ), fn);
    
  await new Promise(resolve => setTimeout(() => resolve(console.log("2"))));
    
  defer(() => console.log("3"), fn);
  console.log("4");
});

await f(); // 2 4 1 3
```

> `defer`red functions can also be async functions!

## Previous Art

Besides getting inspiration from Go's error handling, this package also draws inspiration from the following packages:
- [golike-defer](https://www.npmjs.com/package/golike-defer)
- [with-defer](https://www.npmjs.com/package/with-defer)
- [@borderless-defer](https://www.npmjs.com/package/@borderless/defer)
- ... and many more!
  
## FAQ
  
### Why not use any of the existing packages?

Good you ask! 

There is probably a bit of selfishness in the belief that maybe I can implement this in a better way, but the main reason is to see if I can implement such a library and maybe add some goodies on top.

This code, even though thoroughly tested with 100% code coverage, has not ran in production yet. As such, either you feel adventurous, or I would invite you to look for more mature libraries providing essentially the same functionalities (I've linked to a few I found myself right above, but there are many more).

Anyway, thanks for stopping by! :)

### Why do I need to pass in a `caller` function to `defer`?

JavaScript engines used to support a `Function.caller` property that would have made it trivial to access the function in which `defer` was being called. Unfortunately, that property (amongst a couple of others) was dropped, hence the only feasible way (at least that I can think of) of getting access to the caller was by adding an extra parameter to `defer` directly.

This means that `defer` only work in non-anonymous functions.
 
### Why aren't the `defer`red functions called in last-in-first-out order like in Go?

Good question! 

I'd say it comes down to personal preference, as I think it is easier to reason about the order of the `defer`red functions when they execute in the same order they appear in the code.

## License
MIT