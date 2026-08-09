import Human, { type Config } from "@vladmandic/human";

// Self-hosted (not CDN) — see public/models/human/. Only the face pipeline
// (detector + mesh + description) is enabled; body/hand/object/gesture/
// segmentation are all disabled so their models are never fetched.
const HUMAN_CONFIG: Partial<Config> = {
  modelBasePath: "/models/human/",
  backend: "webgl",
  cacheModels: true,
  warmup: "none",
  debug: false,
  face: {
    enabled: true,
    detector: { enabled: true, modelPath: "blazeface.json", rotation: true, maxDetected: 2 },
    mesh: { enabled: true, modelPath: "facemesh.json" },
    attention: { enabled: false },
    iris: { enabled: false },
    description: { enabled: true, modelPath: "faceres.json" },
    emotion: { enabled: false },
    antispoof: { enabled: false },
    liveness: { enabled: false },
    gear: { enabled: false },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  segmentation: { enabled: false },
};

let loadPromise: Promise<Human> | null = null;

function getHuman(): Promise<Human> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const human = new Human(HUMAN_CONFIG);
    await human.load();
    return human;
  })();
  return loadPromise;
}

/** Pre-warms the face model so the first real capture isn't slowed down by
 * a cold model load. Safe to call multiple times — idempotent. */
export async function loadFaceModel(): Promise<void> {
  await getHuman();
}

export type EmbedFaceResult =
  | { ok: true; embedding: number[] }
  | { ok: false; reason: "no_face" | "multiple_faces" };

/** Runs one detection pass on a live video/canvas frame and returns the
 * 1024-d face descriptor (faceres model) for enrollment/verification.
 * Never touches the network and never returns the frame itself — only the
 * numeric embedding leaves this function. */
export async function embedFace(input: HTMLVideoElement | HTMLCanvasElement): Promise<EmbedFaceResult> {
  const human = await getHuman();
  const result = await human.detect(input);

  if (result.face.length === 0) return { ok: false, reason: "no_face" };
  if (result.face.length > 1) return { ok: false, reason: "multiple_faces" };

  const embedding = result.face[0].embedding;
  if (!embedding || embedding.length === 0) return { ok: false, reason: "no_face" };

  return { ok: true, embedding };
}
