export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FaceMeshResults {
  multiFaceLandmarks: NormalizedLandmark[][];
  image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
}

export interface FaceMeshOptions {
  maxNumFaces?: number;
  refineLandmarks?: boolean;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export interface FaceMeshInstance {
  setOptions(options: FaceMeshOptions): void;
  onResults(callback: (results: FaceMeshResults) => void): void;
  send(input: {
    image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  }): Promise<void>;
  close(): void;
}

export interface FaceMeshConstructor {
  new (config: { locateFile: (file: string) => string }): FaceMeshInstance;
}

// Augment the global Window so TypeScript knows about the CDN global
declare global {
  interface Window {
    FaceMesh: FaceMeshConstructor | undefined;
  }
}
