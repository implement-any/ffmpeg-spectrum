import FFT from "fft.js";
import type { FFTOptions } from "./create-framse.type";

function hannWindow(input: number[]): number[] {
  const N = input.length;
  return input.map((x, n) => x * 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1))));
}

function chunk(pcm: number[], fftSize: number, offset: number): number[] {
  let input = pcm.slice(offset, offset + fftSize);
  if (offset + fftSize > pcm.length)
    input = input.concat(new Array(fftSize - input.length).fill(0));
  return input;
}

function createSpectrum(fft: FFT, input: number[]): number[] {
  const complex = fft.createComplexArray();
  fft.realTransform(complex, hannWindow(input));
  fft.completeSpectrum(complex);
  return complex;
}

function createMangitudes(spectrum: number[]): number[] {
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((sorted.length - 1) * p);
  return sorted[idx] ?? 1;
}

function shapeMag(value: number) {
  const x = Math.log10(value + 1);
  return Math.pow(x, 1.55);
}

function smoothCircular(bars: number[], amount = 0.35) {
  if (amount <= 0) return bars;
  const n = bars.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const prev = bars[(i - 1 + n) % n];
    const cur = bars[i];
    const next = bars[(i + 1) % n];
    const s = (prev + cur * 2 + next) / 4;
    out[i] = cur * (1 - amount) + s * amount;
  }
  return out;
}

function createBarsLog(
  powers: number[],
  barCount: number,
  sampleRate: number,
  fftSize: number,
  minHz: number,
  maxHz: number
) {
  const nyquist = sampleRate / 2;
  const max = Math.min(maxHz, nyquist);

  const minBin = clamp(hzToBin(minHz, sampleRate, fftSize), 1, powers.length - 1);
  const maxBin = clamp(hzToBin(max, sampleRate, fftSize), 1, powers.length - 1);

  const bars = new Array(barCount).fill(0);

  const logMin = Math.log(minHz);
  const logMax = Math.log(max);
  const step = (logMax - logMin) / barCount;

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

    let value = count ? sum / count : 0;

    const hiDamp = Math.pow(fc / 2600, 0.16);
    value /= 1 + hiDamp;

    bars[b] = value;
  }
  return bars;
}

function bandEnergy(
  powers: number[],
  sampleRate: number,
  fftSize: number,
  loHz: number,
  hiHz: number
) {
  const nyquist = sampleRate / 2;
  const lo = clamp(hzToBin(loHz, sampleRate, fftSize), 1, powers.length - 1);
  const hi = clamp(hzToBin(Math.min(hiHz, nyquist), sampleRate, fftSize), 1, powers.length - 1);

  let sum = 0;
  let count = 0;
  for (let i = lo; i <= hi; i++) {
    sum += powers[i];
    count++;
  }
  return count ? sum / count : 0;
}

function smoothRangeCircular(bars: number[], start: number, end: number, amount = 0.55) {
  const out = bars.slice();
  for (let i = start; i <= end; i++) {
    const prev = bars[i - 1] ?? bars[i];
    const cur = bars[i];
    const next = bars[i + 1] ?? bars[i];
    const s = (prev + cur * 2 + next) / 4;
    out[i] = cur * (1 - amount) + s * amount;
  }
  return out;
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
    calibrationSeconds = 15,
    compactDigits = 3,
  }: FFTOptions = {}
) {
  const fft = new FFT(fftSize);
  const rawBarsFrames: number[][] = [];
  const bassTrack: number[] = [];

  for (let offset = 0; offset + fftSize <= pcm.length; offset += hopSize) {
    const input = chunk(pcm, fftSize, offset);
    const spectrum = createSpectrum(fft, input);
    const powers = createMangitudes(spectrum);

    rawBarsFrames.push(createBarsLog(powers, barCount, sampleRate, fftSize, minHz, maxHz));
    bassTrack.push(bandEnergy(powers, sampleRate, fftSize, 40, 140));
  }

  const fps = sampleRate / hopSize;
  const calibrationFrameCount = Math.max(1, Math.floor(calibrationSeconds * fps));

  const calBars = rawBarsFrames.slice(0, calibrationFrameCount);
  const perBar: number[][] = Array.from({ length: barCount }, () => []);

  for (const f of calBars) for (let i = 0; i < barCount; i++) perBar[i].push(f[i] ?? 0);

  const barRef = perBar.map((arr) => Math.max(percentile(arr, 0.95), 1e-9));
  const calBass = bassTrack.slice(0, calibrationFrameCount).map((e) => Math.log10(e + 1));
  const bassRef = Math.max(percentile(calBass, 0.95), 1e-6);

  const frames: number[][] = [];
  const lowEnd = 14;

  let prevOut: number[] | null = null;

  let bassFast = 0;
  let bassSlow = 0;
  let kickEnv = 0;

  const alphaLow = 0.5;
  const alphaHi = 0.3;

  const lowBase = 0.03;
  const lowBaseKickScale = 0.06;
  const kickAddScale = 0.28;

  const floorLow = 0.002;
  const floorHi = 0.0006;

  const m = Math.pow(10, compactDigits);

  for (let f = 0; f < rawBarsFrames.length; f++) {
    let shaped = rawBarsFrames[f].map((v, i) => shapeMag(v / (barRef[i] || 1)));

    const bassN = clamp01(Math.log10(bassTrack[f] + 1) / bassRef);

    bassFast += (bassN - bassFast) * 0.35;
    bassSlow += (bassN - bassSlow) * 0.04;

    const ratio = bassSlow > 1e-6 ? bassFast / bassSlow : 1;
    const kick = clamp01((ratio - 1.08) * 1.8);

    kickEnv = Math.max(kickEnv * 0.9, kick);

    const peaks = [2, 6, 10];

    const ribbon = lowBase + lowBaseKickScale * kickEnv;
    const kickAdd = kickAddScale * kickEnv;

    const rawOut = new Array(barCount).fill(0).map((_, index) => {
      let value = shaped[index];

      if (index <= lowEnd) {
        let bump = 0;
        for (const p of peaks) {
          const d = Math.abs(index - p);
          bump += Math.exp(-(d * d) / 1.6);
        }
        bump /= peaks.length;

        const base = value * 0.75;
        const out = base + ribbon + kickAdd * bump;
        return Math.max(out, floorLow);
      } else {
        value = Math.pow(value, 1.1) * 0.98;
        return Math.max(value, floorHi);
      }
    });

    const ema = rawOut.map((value, index) => {
      const prev = prevOut?.[index] ?? 0;
      const alpha = index <= lowEnd ? alphaLow : alphaHi;
      return prev + (value - prev) * alpha;
    });

    const lowSm = smoothRangeCircular(ema, 0, lowEnd, 0.65);

    const sm = smoothCircular(lowSm, 0.28);

    const out = sm.map(clamp01);
    frames.push(out.map((x) => Math.round(x * m) / m));
    prevOut = out;
  }

  return frames;
}
