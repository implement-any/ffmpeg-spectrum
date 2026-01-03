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

function createMagnitudes(spectrum: number[]): number[] {
  const magnitudes = [];

  for (let i = 0; i < (spectrum.length / 4) * 2; i += 2) {
    const re = spectrum[i];
    const im = spectrum[i + 1];
    magnitudes.push(Math.sqrt(re * re + im * im));
  }

  return magnitudes;
}

function createBars(magnitudes: number[], barCount: number): number[] {
  const bars = new Array(barCount).fill(0);
  const counts = new Array(barCount).fill(0);

  for (let i = 0; i < magnitudes.length; i++) {
    const index = Math.floor((i / magnitudes.length) * barCount);
    bars[index] += magnitudes[i];
    counts[index]++;
  }

  for (let i = 0; i < barCount; i++) {
    if (counts[i] > 0) bars[i] /= counts[i];
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

function normalize(bar: number) {
  const value = Math.log10(bar + 1);
  return Math.pow(value, 0.7);
}

function applyAttackRelease(
  current: number[],
  previous: number[] | null,
  attack = 0.8,
  release = 0.9
): number[] {
  if (!previous) return current;

  return current.map((value, i) => {
    const prev = previous[i] ?? 0;

    if (value > prev) {
      return prev + (value - prev) * attack;
    }

    return prev * release;
  });
}

/**
 *
 * @param pcm 추출한 PCM 데이터
 * @param options 주파수 해상도, 이동 간격, 바 개수
 * @returns 1024 / 44100 => 23ms 프레임 별 Magnitude 값을 담은 배열
 */
export function createFrames(
  pcm: number[],
  { fftSize = 1024, hopSize = 512, barCount = 64 }: FFTOptions
) {
  const fft = new FFT(fftSize);
  const frames = [];

  let prevBars: number[] | null = null;

  for (let offset = 0; offset + fftSize < pcm.length; offset += hopSize) {
    const input = chunk(pcm, fftSize, offset);
    const spectrum = createSpectrum(fft, input);
    const magnitudes = createMagnitudes(spectrum);
    const rawBars = createBars(magnitudes, barCount);
    const smoothed = smoothBars(rawBars);
    const normalized = smoothed.map(normalize);
    const release = applyAttackRelease(normalized, prevBars, 0.7, 0.2);
    frames.push(release);
    prevBars = release;
  }

  return frames;
}
