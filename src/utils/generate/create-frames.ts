import FFT from "fft.js";

import type { FFTOptions } from "./create-framse.type";

function chunk(pcm: number[], fftSize: number, offset: number): number[] {
  let input: number[];

  // offset + fftSize 크기가 PCM 데이터의 크기보다 크면 나머지 부분은 0으로 채우기
  if (offset + fftSize <= pcm.length) {
    input = pcm.slice(offset, offset + fftSize);
  } else {
    input = pcm.slice(offset);
    input = input.concat(new Array(fftSize - input.length).fill(0));
  }

  return input;
}

function createSpectrum(fftSize: number, input: number[]): number[] {
  const fft = new FFT(fftSize);
  const complex = fft.createComplexArray();
  fft.realTransform(complex, input);
  fft.completeSpectrum(complex);
  return complex;
}

function createMagnitudes(spectrum: number[]): number[] {
  const magnitudes = [];

  for (let i = 0; i < spectrum.length; i += 2) {
    const re = spectrum[i];
    const im = spectrum[i + 1];
    magnitudes.push(Math.sqrt(re * re + im * im));
  }

  return magnitudes;
}

function smoothing(bar: number, index: number): number {
  const value = Math.log10(bar + 1);
  return Math.round(value * Math.exp(-index * 0.03) * 100) / 100;
}

function createBars(magnitudes: number[], barCount: number): number[] {
  const bars: number[] = new Array(barCount).fill(0);

  for (let i = 0; i < magnitudes.length; i++) {
    const index = Math.floor((i / magnitudes.length) * barCount);
    bars[index] += magnitudes[i];
  }

  return bars.map(smoothing);
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
  const frames = [];

  for (let offset = 0; offset + fftSize < pcm.length; offset += hopSize) {
    const input = chunk(pcm, fftSize, offset);
    const spectrum = createSpectrum(fftSize, input);
    const magnitudes = createMagnitudes(spectrum);
    frames.push(createBars(magnitudes, barCount));
  }

  return frames;
}
