import FFT from "fft.js";

import type { FFTOptions } from "./create-framse.type";

export function chunk(pcm: number[], fftSize: number, offset: number): number[] {
  let input: number[];

  if (offset + fftSize <= pcm.length) {
    input = pcm.slice(offset, offset + fftSize);
  } else {
    input = pcm.slice(offset);
    input = input.concat(new Array(fftSize - input.length).fill(0));
  }

  return input;
}

export function createSpectrum(fftSize: number, input: number[]): number[] {
  const fft = new FFT(fftSize);
  const complex = fft.createComplexArray();
  fft.realTransform(complex, input);
  fft.completeSpectrum(complex);
  return complex;
}

export function createMagnitudes(spectrum: number[]): number[] {
  const magnitudes = [];

  for (let i = 0; i < spectrum.length; i += 2) {
    const re = spectrum[i];
    const im = spectrum[i + 1];
    magnitudes.push(Math.sqrt(re * re + im * im));
  }

  return magnitudes;
}

export function smoothing(bar: number, index: number): number {
  const value = Math.log10(bar + 1);
  return value * Math.exp(-index * 0.03);
}

export function createBars(magnitudes: number[], barCount: number): number[] {
  const bars: number[] = new Array(barCount).fill(0);

  for (let i = 0; i < magnitudes.length; i++) {
    const index = Math.floor((i / magnitudes.length) * barCount);
    bars[index] += magnitudes[i];
  }

  return bars.map(smoothing);
}

export function createFrames(
  pcm: number[],
  { fftSize = 1024, hopSize = 512, barCount = 64 }: FFTOptions
) {
  const frames = [];

  for (let offset = 0; offset + fftSize < pcm.length; offset += hopSize) {
    const input = chunk(pcm, fftSize, offset);
    const spectrum = createSpectrum(fftSize, input);
    const magnitudes = createMagnitudes(spectrum);
    frames.push(createBars(magnitudes, barCount));
  }

  return frames;
}
