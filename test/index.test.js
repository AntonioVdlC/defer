import { defer, deferrable } from "../src/index.ts";

describe("defer", () => {
  it("is a function", () => {
    expect(defer).toBeFunction();
  });

  it("defers the execution of defered functions in sync functions", () => {
    const mock = jest.fn();
    const deferred = jest.fn();

    function fn() {
      defer(deferred, fn);
      mock();
    }

    fn();

    expect(deferred).toHaveBeenCalledAfter(mock);
  });

  it("defers the execution of defered functions in sync functions (complex)", () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    const deferred1 = jest.fn();
    const deferred2 = jest.fn();

    function fn() {
      defer(deferred1, fn);
      mock1();
      defer(deferred2, fn);
      mock2();
    }

    fn();

    expect(mock1).toHaveBeenCalledBefore(mock2);
    expect(mock2).toHaveBeenCalledBefore(deferred1);
    setTimeout(() => {
      expect(deferred1).toHaveBeenCalledBefore(deferred2);
    }, 0);
  });

  it("defers the execution of defered functions in sync functions (multiple)", () => {
    const mock1 = jest.fn();
    const deferred1 = jest.fn();

    function fn1() {
      defer(deferred1, fn1);
      mock1();
    }

    fn1();

    expect(deferred1).toHaveBeenCalledAfter(mock1);

    const mock2 = jest.fn();
    const deferred2 = jest.fn();

    function fn2() {
      defer(deferred2, fn2);
      mock2();
    }

    fn2();

    expect(deferred2).toHaveBeenCalledAfter(mock2);
  });
});

describe("deferrable", () => {
  it("is a function", () => {
    expect(deferrable).toBeFunction();
  });

  it("defers the execution of defered functions in async functions", async () => {
    const mock = jest.fn();
    const deferred = jest.fn();

    const func = deferrable(async function fn() {
      defer(deferred, fn);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock();
          resolve();
        }, 100)
      );
    });

    await func();

    expect(deferred).toHaveBeenCalledAfter(mock);
  });

  it("defers the execution of defered functions in async functions (complex)", async () => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    const deferred1 = jest.fn();
    const deferred2 = jest.fn();

    const func = deferrable(async function fn() {
      defer(
        async () =>
          await new Promise((resolve) =>
            setTimeout(() => resolve(deferred1()), 100)
          ),
        fn
      );

      await new Promise((resolve) =>
        setTimeout(() => {
          mock1();
          resolve();
        }, 100)
      );

      defer(deferred2, fn);

      mock2();
    });

    await func();

    expect(mock1).toHaveBeenCalledBefore(mock2);
    expect(mock2).toHaveBeenCalledBefore(deferred1);
    expect(deferred1).toHaveBeenCalledBefore(deferred2);
  });

  it("defers the execution of defered functions in async functions (multiple)", async () => {
    const mock1 = jest.fn();
    const deferred1 = jest.fn();

    const func1 = deferrable(async function fn1() {
      defer(deferred1, fn1);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock1();
          resolve();
        }, 100)
      );
    });

    await func1();

    expect(deferred1).toHaveBeenCalledAfter(mock1);

    const mock2 = jest.fn();
    const deferred2 = jest.fn();

    const func2 = deferrable(async function fn2() {
      defer(deferred2, fn2);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock2();
          resolve();
        }, 100)
      );
    });

    await func2();

    expect(deferred2).toHaveBeenCalledAfter(mock2);
  });

  it("returns the result from the wrapped function", async () => {
    const value = 42;
    const deferred = jest.fn();

    const func = deferrable(async function fn() {
      defer(deferred, fn);

      const result = await new Promise((resolve) =>
        setTimeout(() => {
          resolve(value);
        }, 100)
      );

      return result;
    });

    const returnedValue = await func();

    expect(returnedValue).toEqual(value);
    expect(deferred).toHaveBeenCalled();
  });

  it("throws if the wrapped function throws, and doesn't run deferred functions", async () => {
    const deferred = jest.fn();

    const func = deferrable(async function fn() {
      defer(deferred, fn);

      await new Promise((resolve) =>
        setTimeout(() => {
          resolve(42);
        }, 100)
      );
      throw new Error();
    });

    try {
      await func();
    } catch (err) {
      expect(err).not.toBeNull();
      expect(deferred).not.toHaveBeenCalled();
    }
  });

  it("throws if a deferred function throws, and doesn't run subsequent deferred functions", async () => {
    const mock = jest.fn();
    const deferred = jest.fn();

    const func = deferrable(async function fn() {
      defer(() => {
        throw new Error();
      }, fn);

      defer(deferred, fn);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock();
          resolve();
        }, 100)
      );
    });

    try {
      await func();
    } catch (err) {
      expect(err).not.toBeNull();
      expect(mock).toHaveBeenCalled();
      expect(deferred).not.toHaveBeenCalled();
    }
  });
});
