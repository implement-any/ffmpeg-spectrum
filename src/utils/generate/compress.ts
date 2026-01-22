export function quantizeToUint8(bar: number): number {
  const clamped = Math.max(0, Math.min(1, bar));
  return Math.round(clamped * 255);
}

export function u8ToBin(frames: number[][], barCount: number) {
  let pointer = 0;
  const bin = new Uint8Array(frames.length * barCount);

  for (let i = 0; i < frames.length; i++) {
    const bars = frames[i];
    for (let j = 0; j < barCount; j++) {
      const bar = bars[j] ?? 0;
      bin[pointer++] = quantizeToUint8(bar);
    }
  }

  return bin;
}
