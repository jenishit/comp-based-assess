/**
 * Pre-exam environment checks: virtual machines, multiple monitors, and
 * Safe Exam Browser detection.
 *
 * Honest limits, stated up front: a web page cannot *prove* it isn't in a VM
 * or that no OS-level screen recorder is running — these are heuristics that
 * raise the bar and give instructors a signal, not hard guarantees. True
 * lockdown requires a kiosk client like Safe Exam Browser, which is why SEB
 * presence is detected and surfaced as a positive signal.
 */

export interface EnvironmentReport {
  vmSuspected: boolean;
  vmRenderer: string | null;
  multipleMonitors: boolean;
  sebDetected: boolean;
  hardwareConcurrency: number;
}

// WebGL renderer strings that only ever show up inside virtual machines or
// software-rendered (headless/automation) contexts.
const VM_RENDERER_PATTERNS: RegExp[] = [
  /vmware/i,
  /virtualbox/i,
  /\bvbox\b/i,
  /parallels/i,
  /hyper-v/i,
  /qemu/i,
  /virgl/i, // QEMU/KVM virtio-gpu
  /llvmpipe/i, // Mesa software rasterizer — common in VMs/headless
  /swiftshader/i, // Chrome's software fallback — also headless/automation
  /microsoft basic render/i, // Windows fallback driver, standard in VMs
];

/** Pure classifier so it's unit-testable without a WebGL context. */
export function isVmRenderer(renderer: string | null | undefined): boolean {
  if (!renderer) return false;
  return VM_RENDERER_PATTERNS.some((p) => p.test(renderer));
}

export function getWebGLRenderer(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl || !("getExtension" in gl)) return null;
    const ctx = gl as WebGLRenderingContext;
    // Modern Chromium reports the real renderer through the plain RENDERER
    // query; the debug extension covers older browsers.
    const debugInfo = ctx.getExtension("WEBGL_debug_renderer_info");
    const param = debugInfo ? debugInfo.UNMASKED_RENDERER_WEBGL : ctx.RENDERER;
    return String(ctx.getParameter(param));
  } catch {
    return null;
  }
}

export function isSafeExamBrowser(userAgent: string = navigator.userAgent): boolean {
  return /SEB[\s/]|SafeExamBrowser/i.test(userAgent);
}

/** `screen.isExtended` is Chromium's multi-display signal (Window Management
 * API) — no permission prompt needed for the boolean itself. */
export function hasMultipleMonitors(): boolean {
  const s = window.screen as Screen & { isExtended?: boolean };
  return s.isExtended === true;
}

export function runEnvironmentCheck(): EnvironmentReport {
  const renderer = getWebGLRenderer();
  return {
    vmSuspected: isVmRenderer(renderer),
    vmRenderer: renderer,
    multipleMonitors: hasMultipleMonitors(),
    sebDetected: isSafeExamBrowser(),
    hardwareConcurrency: navigator.hardwareConcurrency ?? 0,
  };
}

/**
 * Replaces getDisplayMedia for the lifetime of the exam so any in-page
 * attempt to start a screen capture (e.g. injected extension code sharing
 * the exam tab) is refused and reported. OS-level recorders are outside the
 * browser sandbox and cannot be detected — this covers the in-browser vector
 * only. Returns an undo function.
 */
export function installScreenCaptureGuard(onAttempt: () => void): () => void {
  const mediaDevices = navigator.mediaDevices;
  if (!mediaDevices?.getDisplayMedia) return () => {};
  const original = mediaDevices.getDisplayMedia.bind(mediaDevices);
  mediaDevices.getDisplayMedia = async () => {
    onAttempt();
    throw new DOMException("Screen capture is disabled during the exam", "NotAllowedError");
  };
  return () => {
    mediaDevices.getDisplayMedia = original;
  };
}
