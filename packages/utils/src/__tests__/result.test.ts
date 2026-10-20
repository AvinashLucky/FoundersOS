import { describe, it, expect } from "vitest";
import { ok, err, isOk, isErr, map, flatMap, unwrapOr, fromThrowable, fromPromise } from "../result";

describe("Result", () => {
  it("constructs ok and err", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err("bad")).toEqual({ ok: false, error: "bad" });
  });

  it("narrows with isOk / isErr", () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err("e"))).toBe(true);
  });

  it("map transforms success, passes errors through", () => {
    expect(map(ok(2), (n) => n * 3)).toEqual(ok(6));
    expect(map(err("e"), (n: number) => n * 3)).toEqual(err("e"));
  });

  it("flatMap chains and short-circuits", () => {
    const half = (n: number) => (n % 2 === 0 ? ok(n / 2) : err("odd"));
    expect(flatMap(ok(8), half)).toEqual(ok(4));
    expect(flatMap(ok(7), half)).toEqual(err("odd"));
    expect(flatMap(err("first"), half)).toEqual(err("first"));
  });

  it("unwrapOr falls back without throwing", () => {
    expect(unwrapOr(ok(5), 0)).toBe(5);
    expect(unwrapOr(err("e"), 0)).toBe(0);
  });

  it("fromThrowable captures throws", () => {
    expect(fromThrowable(() => 1)).toEqual(ok(1));
    const r = fromThrowable(() => {
      throw new Error("boom");
    });
    expect(isErr(r) && r.error.message).toBe("boom");
  });

  it("fromPromise captures rejections", async () => {
    await expect(fromPromise(Promise.resolve(1))).resolves.toEqual(ok(1));
    const r = await fromPromise(Promise.reject(new Error("no")));
    expect(isErr(r) && r.error.message).toBe("no");
  });
});
