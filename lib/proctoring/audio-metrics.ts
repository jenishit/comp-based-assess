/** RMS amplitude (0-255) of a byte-frequency-domain slice. */
export function rms(bins: Uint8Array): number {
  if (bins.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < bins.length; i++) sum += bins[i] * bins[i];
  return Math.sqrt(sum / bins.length);
}

/** Spectral variance of a byte-frequency-domain slice — high for broadband
 * noise or overlapping voices, low for a single steady tone/voice. */
export function variance(bins: Uint8Array): number {
  if (bins.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < bins.length; i++) sum += bins[i];
  const mean = sum / bins.length;
  let sq = 0;
  for (let i = 0; i < bins.length; i++) sq += (bins[i] - mean) ** 2;
  return sq / bins.length;
}

// Speech range ~150-3000 Hz. At fftSize=512, sampleRate≈44100 Hz, bin width
// ≈86 Hz, so bins 2-35 ≈172-3010 Hz. Shared by useAudioMonitor and the
// calibration step so both read the same slice of the spectrum.
export const VOICE_BIN_RANGE = [2, 36] as const;

export function voiceBins(data: Uint8Array): Uint8Array {
  return data.subarray(VOICE_BIN_RANGE[0], VOICE_BIN_RANGE[1]);
}
