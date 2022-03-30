const deferArray = Symbol("Defer array");

declare global {
  interface Function {
    [deferArray]: Array<Function>;
  }
}

function defer(fn: Function, caller: Function): void {
  if (caller.constructor.name === "Function") {
    setTimeout(fn, 0);
  } else if (caller.constructor.name === "AsyncFunction") {
    if (!Array.isArray(caller[deferArray])) {
      caller[deferArray] = [];
    }
    caller[deferArray].push(fn);
  }
}

function deferrable(fn: Function): Function {
  const f = async () => {
    const result = await fn();

    for (let i = 0, length = fn[deferArray].length; i < length; i++) {
      await fn[deferArray][i]();
    }

    return result;
  };

  return f;
}

export { defer, deferrable };
