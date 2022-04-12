import { describe, it, expect, vi } from "vitest";

import { defer, deferrable } from "../src";

describe("defer", () => {
  it("is a function", () => {
    expect(typeof defer).toBe("function");
  });

  it("defers the execution of defered functions in sync functions", () => {
    const mock = vi.fn();
    const deferred = vi.fn();

    function fn() {
      defer(deferred, fn);
      mock();
    }

    fn();

    setTimeout(() => {
      expect(mock.mock.invocationCallOrder[0]).toBeLessThan(
        deferred.mock.invocationCallOrder[0]
      );
    }, 0);
  });

  it("defers the execution of defered functions in sync functions (complex)", () => {
    const mock1 = vi.fn();
    const mock2 = vi.fn();
    const deferred1 = vi.fn();
    const deferred2 = vi.fn();

    function fn() {
      defer(deferred1, fn);
      mock1();
      defer(deferred2, fn);
      mock2();
    }

    fn();

    setTimeout(() => {
      expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
        mock2.mock.invocationCallOrder[0]
      );
      expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
        deferred1.mock.invocationCallOrder[0]
      );
      expect(mock2.mock.invocationCallOrder[0]).toBeLessThan(
        deferred2.mock.invocationCallOrder[0]
      );
      expect(deferred1.mock.invocationCallOrder[0]).toBeLessThan(
        deferred2.mock.invocationCallOrder[0]
      );
    }, 0);
  });

  it("defers the execution of defered functions in sync functions (multiple)", () => {
    const mock1 = vi.fn();
    const deferred1 = vi.fn();

    function fn1() {
      defer(deferred1, fn1);
      mock1();
    }

    fn1();

    const mock2 = vi.fn();
    const deferred2 = vi.fn();

    function fn2() {
      defer(deferred2, fn2);
      mock2();
    }

    fn2();

    setTimeout(() => {
      expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
        mock2.mock.invocationCallOrder[0]
      );
      expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
        deferred1.mock.invocationCallOrder[0]
      );
      expect(mock2.mock.invocationCallOrder[0]).toBeLessThan(
        deferred2.mock.invocationCallOrder[0]
      );
      expect(deferred1.mock.invocationCallOrder[0]).toBeLessThan(
        deferred2.mock.invocationCallOrder[0]
      );
    }, 0);
  });
});

describe("deferrable", () => {
  it("is a function", () => {
    expect(typeof deferrable).toBe("function");
  });

  it("defers the execution of defered functions in async functions", async () => {
    const mock = vi.fn();
    const deferred = vi.fn();

    const func = deferrable(async function fn() {
      defer(deferred, fn);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock();
          resolve(true);
        }, 100)
      );
    });

    await func();

    expect(mock.mock.invocationCallOrder[0]).toBeLessThan(
      deferred.mock.invocationCallOrder[0]
    );
  });

  it("defers the execution of defered functions in async functions (complex)", async () => {
    const mock1 = vi.fn();
    const mock2 = vi.fn();
    const deferred1 = vi.fn();
    const deferred2 = vi.fn();

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
          resolve(true);
        }, 100)
      );

      defer(deferred2, fn);

      mock2();
    });

    await func();

    expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
      mock2.mock.invocationCallOrder[0]
    );
    expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
      deferred1.mock.invocationCallOrder[0]
    );
    expect(mock2.mock.invocationCallOrder[0]).toBeLessThan(
      deferred2.mock.invocationCallOrder[0]
    );
    expect(deferred1.mock.invocationCallOrder[0]).toBeLessThan(
      deferred2.mock.invocationCallOrder[0]
    );
  });

  it("defers the execution of defered functions in async functions (multiple)", async () => {
    const mock1 = vi.fn();
    const deferred1 = vi.fn();

    const func1 = deferrable(async function fn1() {
      defer(deferred1, fn1);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock1();
          resolve(true);
        }, 100)
      );
    });

    await func1();

    const mock2 = vi.fn();
    const deferred2 = vi.fn();

    const func2 = deferrable(async function fn2() {
      defer(deferred2, fn2);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock2();
          resolve(true);
        }, 100)
      );
    });

    await func2();

    expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
      mock2.mock.invocationCallOrder[0]
    );
    expect(mock1.mock.invocationCallOrder[0]).toBeLessThan(
      deferred1.mock.invocationCallOrder[0]
    );
    expect(mock2.mock.invocationCallOrder[0]).toBeLessThan(
      deferred2.mock.invocationCallOrder[0]
    );
    expect(deferred1.mock.invocationCallOrder[0]).toBeLessThan(
      deferred2.mock.invocationCallOrder[0]
    );
  });

  it("returns the result from the wrapped function", async () => {
    const value = 42;
    const deferred = vi.fn();

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
    const deferred = vi.fn();

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
    const mock = vi.fn();
    const deferred = vi.fn();

    const func = deferrable(async function fn() {
      defer(() => {
        throw new Error();
      }, fn);

      defer(deferred, fn);

      await new Promise((resolve) =>
        setTimeout(() => {
          mock();
          resolve(true);
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
