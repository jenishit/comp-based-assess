import { describe, expect, it } from "vitest";
import { isVmRenderer, isSafeExamBrowser } from "@/lib/proctoring/environment-check";

describe("isVmRenderer", () => {
  it("flags known virtualization renderers", () => {
    const vmRenderers = [
      "VMware SVGA 3D",
      "VirtualBox Graphics Adapter",
      "Parallels Display Adapter (WDDM)",
      "llvmpipe (LLVM 15.0.0, 256 bits)",
      "Google SwiftShader",
      "Microsoft Basic Render Driver",
      "virgl (Virtio-GPU)",
    ];
    for (const r of vmRenderers) {
      expect(isVmRenderer(r), r).toBe(true);
    }
  });

  it("passes real GPU renderers", () => {
    const realRenderers = [
      "ANGLE (NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)",
      "Apple M2",
      "Intel(R) Iris(R) Xe Graphics",
      "AMD Radeon RX 6700 XT",
    ];
    for (const r of realRenderers) {
      expect(isVmRenderer(r), r).toBe(false);
    }
  });

  it("treats missing renderer as not-a-VM (no false positive)", () => {
    expect(isVmRenderer(null)).toBe(false);
    expect(isVmRenderer(undefined)).toBe(false);
    expect(isVmRenderer("")).toBe(false);
  });
});

describe("isSafeExamBrowser", () => {
  it("detects SEB user-agent variants", () => {
    expect(isSafeExamBrowser("Mozilla/5.0 SEB/3.5 (Windows)")).toBe(true);
    expect(isSafeExamBrowser("Mozilla/5.0 ... SafeExamBrowser/2.4")).toBe(true);
  });

  it("returns false for ordinary browsers", () => {
    expect(isSafeExamBrowser("Mozilla/5.0 (Windows NT 10.0) Chrome/120")).toBe(false);
  });
});
