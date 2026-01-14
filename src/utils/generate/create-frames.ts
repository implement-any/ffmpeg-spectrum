import FFT from "fft.js";
import type { FFTOptions } from "./create-framse.type";

function hannWindow(input: number[]): number[] {
  const N = input.length;
  return input.map((x, n) => x * 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1))));
}

function chunk(pcm: number[], fftSize: number, offset: number): number[] {
  let input = pcm.slice(offset, offset + fftSize);

  if (offset + fftSize > pcm.length) {
    input = input.concat(new Array(fftSize - input.length).fill(0));
  }

  return input;
}

function createSpectrum(fft: FFT, input: number[]): number[] {
  const complex = fft.createComplexArray();
  fft.realTransform(complex, hannWindow(input));
  fft.completeSpectrum(complex);
  return complex;
}

function createPowers(spectrum: number[]): number[] {
  const powers: number[] = [];

  for (let i = 0; i < (spectrum.length / 4) * 2; i += 2) {
    const re = spectrum[i];
    const im = spectrum[i + 1];
    powers.push(re * re + im * im);
  }

  if (powers.length > 0) powers[0] = 0;

  return powers;
}

function hzToBin(hz: number, sampleRate: number, fftSize: number) {
  return Math.round((hz * fftSize) / sampleRate);
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function createBarsLogFromPowers(
  powers: number[],
  barCount: number,
  sampleRate: number,
  fftSize: number,
  minHz = 40,
  maxHz = 16000
): number[] {
  const nyquist = sampleRate / 2;
  const max = Math.min(maxHz, nyquist);

  const minBin = clamp(hzToBin(minHz, sampleRate, fftSize), 1, powers.length - 1);
  const maxBin = clamp(hzToBin(max, sampleRate, fftSize), 1, powers.length - 1);

  const bars = new Array(barCount).fill(0);

  const logMin = Math.log(minHz);
  const logMax = Math.log(max);
  const step = (logMax - logMin) / barCount;

  const pivotHz = 1600;
  const tiltAlpha = 0.9;
  const lowCutHz = 250;
  const lowSuppress = 0.1;

  for (let b = 0; b < barCount; b++) {
    const f0 = Math.exp(logMin + step * b);
    const f1 = Math.exp(logMin + step * (b + 1));
    const fc = Math.sqrt(f0 * f1);

    let start = clamp(hzToBin(f0, sampleRate, fftSize), minBin, maxBin);
    let end = clamp(hzToBin(f1, sampleRate, fftSize), minBin, maxBin);

    if (end <= start) end = start + 1;
    end = Math.min(end, maxBin);

    let sum = 0;
    let count = 0;

    for (let i = start; i <= end; i++) {
      sum += powers[i];
      count++;
    }

    let v = count > 0 ? sum / count : 0;

    const tilt = Math.pow(fc / pivotHz, tiltAlpha);
    const low = fc < lowCutHz ? lowSuppress : 1.0;

    v *= tilt * low;

    bars[b] = v;
  }

  return bars;
}

function smoothBars(bars: number[]): number[] {
  return bars.map((current, i) => {
    const prev = bars[i - 1] ?? current;
    const next = bars[i + 1] ?? current;
    return (prev + current * 2 + next) / 4;
  });
}

function normalizeFromMag(mag: number) {
  const value = Math.log10(mag + 1);
  return Math.pow(value, 0.8);
}

function applyAttackRelease(
  current: number[],
  previous: number[] | null,
  attack = 0.8,
  release = 0.22
): number[] {
  if (!previous) return current;

  return current.map((value, i) => {
    const prev = previous[i] ?? 0;
    const k = value > prev ? attack : release;
    return prev + (value - prev) * k;
  });
}

function applyEMA(current: number[], prevEma: number[] | null, alpha = 0.3) {
  if (!prevEma) return current;
  return current.map((v, i) => {
    const p = prevEma[i] ?? 0;
    return p + (v - p) * alpha;
  });
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function compact(bars: number[], digits = 3): number[] {
  const m = Math.pow(10, digits);
  return bars.map((bar) => Math.round(bar * m) / m);
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx] ?? 1;
}

function computeBarRefsP95(frames: number[][], p = 0.95) {
  if (frames.length === 0) return [];
  const barCount = frames[0].length;

  const perBar: number[][] = Array.from({ length: barCount }, () => []);

  for (const f of frames) {
    for (let i = 0; i < barCount; i++) {
      perBar[i].push(f[i] ?? 0);
    }
  }

  return perBar.map((arr) => {
    const ref = percentile(arr, p);
    return Math.max(ref, 1e-6); // 0.000001
  });
}

function softLimit(x: number) {
  return x / (1 + x);
}

function gamma(x: number) {
  const g = 1.6;
  return Math.pow(x, g);
}

function transientBoost(cur: number[], prev: number[] | null, amount = 1.2) {
  if (!prev) return cur;
  return cur.map((v, i) => v + Math.max(0, v - (prev[i] ?? 0)) * amount);
}

export function createFrames(
  pcm: number[],
  {
    fftSize = 1024,
    hopSize = 512,
    barCount = 64,
    sampleRate = 44100,
    minHz = 40,
    maxHz = 16000,
    attack = 0.9,
    release = 0.35,
    emaAlpha = 0.6,
    calibrationSeconds = 20,
    compactDigits = 3,
  }: FFTOptions = {}
) {
  const fft = new FFT(fftSize);

  const normalizedFrames: number[][] = [];

  for (let offset = 0; offset + fftSize <= pcm.length; offset += hopSize) {
    const input = chunk(pcm, fftSize, offset);
    const spectrum = createSpectrum(fft, input);
    const powers = createPowers(spectrum);

    const rawBars = createBarsLogFromPowers(powers, barCount, sampleRate, fftSize, minHz, maxHz);

    const smoothed = smoothBars(rawBars);
    const normalized = smoothed.map(normalizeFromMag);

    normalizedFrames.push(normalized);
  }

  const fps = sampleRate / hopSize;
  const calibrationFrameCount = Math.max(1, Math.floor(calibrationSeconds * fps));
  const calibrationSlice = normalizedFrames.slice(0, calibrationFrameCount);

  const globalRef = percentile(calibrationSlice.flat(), 0.95);
  const refsBar = computeBarRefsP95(calibrationSlice, 0.95);
  const refs = refsBar.map((r, i) => {
    const t = i / (refsBar.length - 1);
    const wGlobal = 0.15 + 0.35 * t;
    const wBar = 1 - wGlobal;

    return wBar * r + wGlobal * globalRef;
  });

  const frames: number[][] = [];
  let prevBars: number[] | null = null;
  let prevNorm: number[] | null = null;

  for (const normalized of normalizedFrames) {
    const scaled = normalized.map((v, i) => (v / (refs[i] ?? 1)) * 2.2);

    const shaped0 = scaled.map(softLimit).map(gamma);

    const punched = transientBoost(shaped0, prevNorm, 1.2);
    prevNorm = punched;

    const eased = applyAttackRelease(punched, prevBars, attack, release);

    const out = eased.map(clamp01);

    frames.push(compact(out, compactDigits));
    prevBars = out;
  }

  return frames;
}
