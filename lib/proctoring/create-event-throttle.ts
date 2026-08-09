export function createEventThrottle<T extends string>() {
  const lastFired: Partial<Record<T, number>> = {};

  return function canFire(type: T, minGapMs: number): boolean {
    const now = Date.now();
    const last = lastFired[type] ?? 0;
    if (now - last < minGapMs) return false;
    lastFired[type] = now;
    return true;
  };
}
