declare global {
  interface Function {
    __$_deferArr: Array<Function>;
  }
}

if (!Array.isArray(Function.prototype.__$_deferArr)) {
  Function.prototype.__$_deferArr = [];
}

function defer(fn: Function, caller: Function): void {
  if (caller.constructor.name === "Function") {
    setTimeout(fn, 0);
  } else if (caller.constructor.name === "AsyncFunction") {
    caller.__$_deferArr.push(fn);
  }
}

function deferrable(fn: Function): Function {
  const f = async () => {
    await fn();

    for (let i = 0, length = fn.__$_deferArr.length; i < length; i++) {
      await fn.__$_deferArr[i]();
    }
  };

  return f;
}

export { defer, deferrable };
