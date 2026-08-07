import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEventThrottle } from "@/lib/proctoring/create-event-throttle";

describe("createEventThrottle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows the first fire and blocks within the window", () => {
    const canFire = createEventThrottle<string>();
    expect(canFire("tab_switch", 2000)).toBe(true);
    expect(canFire("tab_switch", 2000)).toBe(false);
    vi.advanceTimersByTime(1999);
    expect(canFire("tab_switch", 2000)).toBe(false);
    vi.advanceTimersByTime(2);
    expect(canFire("tab_switch", 2000)).toBe(true);
  });

  it("tracks each event type independently", () => {
    const canFire = createEventThrottle<string>();
    expect(canFire("phone_detected", 5000)).toBe(true);
    // A different type isn't blocked by the first type's window.
    expect(canFire("book_detected", 5000)).toBe(true);
    expect(canFire("phone_detected", 5000)).toBe(false);
  });
});
