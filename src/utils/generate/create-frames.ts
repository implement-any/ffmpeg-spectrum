import FFT from "fft.js";
import type { FFTOptions, FrequencyBand } from "./create-framse.type";

/** EDM 최적화 주파수 대역 설정 */
const FREQUENCY_BANDS: FrequencyBand[] = [
  { range: [20, 60], boost: 1.5, decay: 0.88 },
  { range: [60, 150], boost: 1.6, decay: 0.85 },
  { range: [150, 300], boost: 1.3, decay: 0.87 },
  { range: [300, 2000], boost: 1.0, decay: 0.78 },
  { range: [2000, 8000], boost: 0.85, decay: 0.72 },
  { range: [8000, 16000], boost: 0.7, decay: 0.65 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const clamp01 = (value: number) => clamp(value, 0, 1);

const hzToBin = (hz: number, sampleRate: number, fftSize: number): number => {
  return Math.round((hz * fftSize) / sampleRate);
}

/** 스펙트럼 누출 방지를 위한 Hann Window 적용 함수 */
function applyHannWindow(samples: number[]): number[] {
  const N = samples.length;
  const factor = (2 * Math.PI) / (N - 1);
  return samples.map((sample, n) => sample * 0.5 * (1 - Math.cos(factor * n)));
}

/** PCM에서 FFT용 청크를 추출하는 함수 */
function extractChunk(pcm: number[], fftSize: number, offset: number): number[] {
  const chunk = pcm.slice(offset, offset + fftSize);
  if (chunk.length < fftSize) {
    return [...chunk, ...new Array(fftSize - chunk.length).fill(0)];
  }
  return chunk;
}

/** FFT를 수행해 복소수 스펙트럼을 생성하는 함수 */
function computeSpectrum(fft: FFT, samples: number[]): number[] {
  const windowed = applyHannWindow(samples);
  const spectrum = fft.createComplexArray();
  fft.realTransform(spectrum, windowed);
  fft.completeSpectrum(spectrum);
  return spectrum;
}

/** 복소수 스펙트럼에서 파워를 계산하는 함수 */
function computePowerSpectrum(spectrum: number[]): number[] {
  const powers: number[] = [];
  const halfLength = spectrum.length / 2;

  /** 주파수 크기 구하는 공식을 적용하여 파워를 계산 */
  for (let i = 0; i < halfLength; i += 2) {
    const re = spectrum[i];
    const im = spectrum[i + 1];
    powers.push(re * re + im * im);
  }

  if (powers.length > 0) powers[0] = 0;
  return powers;
}

/** 특정 주파수 대역의 평균 에너지를 계산하는 함수 */
function getBandEnergy(
  powers: number[],
  loHz: number,
  hiHz: number,
  sampleRate: number,
  fftSize: number
): number {
  const nyquist = sampleRate / 2;
  const lo = clamp(hzToBin(loHz, sampleRate, fftSize), 1, powers.length - 1);
  const hi = clamp(hzToBin(Math.min(hiHz, nyquist), sampleRate, fftSize), 1, powers.length - 1);

  let sum = 0;
  for (let i = lo; i <= hi; i++) {
    sum += powers[i];
  }
  return sum / (hi - lo + 1);
}

/** 로그 스케일로 시각화 바를 생성하는 함수 */
function createLogScaleBars(
  powers: number[],
  barCount: number,
  sampleRate: number,
  fftSize: number,
  minHz: number,
  maxHz: number,
  bands: FrequencyBand[]
): number[] {
  const nyquist = sampleRate / 2;
  const effectiveMaxHz = Math.min(maxHz, nyquist);

  const logMin = Math.log(minHz);
  const logMax = Math.log(effectiveMaxHz);
  const logStep = (logMax - logMin) / barCount;

  const bars: number[] = [];

  for (let b = 0; b < barCount; b++) {
    const freqLo = Math.exp(logMin + logStep * b);
    const freqHi = Math.exp(logMin + logStep * (b + 1));
    const freqCenter = Math.sqrt(freqLo * freqHi);

    let binStart = clamp(hzToBin(freqLo, sampleRate, fftSize), 1, powers.length - 1);
    let binEnd = clamp(hzToBin(freqHi, sampleRate, fftSize), 1, powers.length - 1);

    if (binEnd <= binStart) binEnd = binStart + 1;
    binEnd = Math.min(binEnd, powers.length - 1);

    let sum = 0;
    for (let i = binStart; i <= binEnd; i++) {
      sum += powers[i];
    }
    let value = sum / (binEnd - binStart + 1);

    const band = bands.find(
      (band) => freqCenter >= band.range[0] && freqCenter < band.range[1]
    );
    if (band) {
      value *= band.boost;
    }

    bars.push(value);
  }

  return bars;
}

/** 킥 드럼을 감지하는 함수 */
function detectKick(
  currentEnergy: number,
  previousEnergy: number,
  sensitivity: number
): number {
  if (previousEnergy < 0.0001) return 0;

  const ratio = currentEnergy / previousEnergy;
  const threshold = 1.0 + 0.5 / sensitivity;

  if (ratio > threshold) {
    return clamp01((ratio - threshold) * sensitivity * 0.5);
  }
  return 0;
}

/** 사이드체인 펌핑 효과를 적용하는 함수 */
function applySidechainPumping(
  bars: number[],
  kickIntensity: number,
  pumpingStrength: number,
  barCount: number
): number[] {
  if (pumpingStrength <= 0 || kickIntensity <= 0) return bars;

  return bars.map((value, index) => {
    const position = index / barCount;
    const pumpAmount = kickIntensity * pumpingStrength * position * 0.6;
    return value * Math.max(1 - pumpAmount, 0.6);
  });
}

/** 킥에 반응해 저역대를 부스트하는 함수 */
function applyKickBoost(
  bars: number[],
  kickEnvelope: number,
  barCount: number
): number[] {
  const lowEndRatio = 0.25;
  const lowEndCount = Math.floor(barCount * lowEndRatio);

  return bars.map((value, index) => {
    if (index < lowEndCount) {
      const boostFactor = 1 + kickEnvelope * 0.5;
      return value * boostFactor;
    }
    return value;
  });
}

/** Attack/Decay EMA를 적용하는 함수 */
function applyAttackDecay(
  current: number[],
  previous: number[] | null,
  attackAlpha: number,
  decayAlpha: number
): number[] {
  if (!previous) return current;

  return current.map((value, index) => {
    const prev = previous[index] ?? 0;
    const alpha = value > prev ? attackAlpha : decayAlpha;
    return prev + (value - prev) * alpha;
  });
}

/** 원형 시각화를 위한 스무딩 함수 */
function smoothCircular(bars: number[], strength: number): number[] {
  if (strength <= 0) return bars;

  const n = bars.length;
  return bars.map((current, i) => {
    const prev = bars[(i - 1 + n) % n];
    const next = bars[(i + 1) % n];
    const smoothed = (prev + current * 2 + next) / 4;
    return current * (1 - strength) + smoothed * strength;
  });
}

/** 로그 스케일로 값을 정규화하는 함수 */
function normalizeWithLog(value: number, reference: number): number {
  const normalized = value / Math.max(reference, 1e-9);
  const logged = Math.log10(normalized + 1);
  return Math.pow(logged, 0.7);
}

/** 백분위수를 계산하는 함수 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((sorted.length - 1) * p);
  return sorted[index] ?? 1;
}

/** 캘리브레이션 기준값을 계산하는 함수 */
function calculateCalibration(
  rawFrames: number[][],
  bassEnergies: number[],
  calibrationFrameCount: number,
  barCount: number
): { barReferences: number[]; bassReference: number } {
  const calFrames = rawFrames.slice(0, calibrationFrameCount);
  const calBass = bassEnergies.slice(0, calibrationFrameCount);

  const barReferences = Array.from({ length: barCount }, (_, barIndex) => {
    const values = calFrames.map((frame) => frame[barIndex] ?? 0);
    return percentile(values, 0.95);
  });

  const bassReference = percentile(
    calBass.map((e) => Math.log10(e + 1)),
    0.95
  );

  return {
    barReferences: barReferences.map((r) => Math.max(r, 1e-9)),
    bassReference: Math.max(bassReference, 1e-6),
  };
}

/** PCM 오디오에서 시각화 프레임을 생성하는 메인 함수 */
export function createFrames(
  pcm: number[],
  options: FFTOptions = {}
): number[][] {
  const {
    fftSize = 2048,
    hopSize = 512,
    barCount = 64,
    sampleRate = 44100,
    minHz = 30,
    maxHz = 16000,
    kickSensitivity = 1.3,
    pumpingIntensity = 0.3,
    bassBoost = 1.4,
    attackSpeed = 0.65,
    decaySpeed = 0.15,
    smoothing = 0.25,
    calibrationSeconds = 10,
    compactDigits = 3,
  } = options;

  const bands = FREQUENCY_BANDS.map((band) => ({
    ...band,
    boost: band.range[1] <= 300 ? band.boost * bassBoost : band.boost,
  }));

  const fft = new FFT(fftSize);
  const multiplier = Math.pow(10, compactDigits);

  // 1단계: raw 데이터 수집
  const rawBarsFrames: number[][] = [];
  const bassEnergies: number[] = [];

  for (let offset = 0; offset + fftSize <= pcm.length; offset += hopSize) {
    const chunk = extractChunk(pcm, fftSize, offset);
    const spectrum = computeSpectrum(fft, chunk);
    const powers = computePowerSpectrum(spectrum);

    const bars = createLogScaleBars(
      powers, barCount, sampleRate, fftSize, minHz, maxHz, bands
    );
    rawBarsFrames.push(bars);

    const bassEnergy = getBandEnergy(powers, 60, 150, sampleRate, fftSize);
    bassEnergies.push(bassEnergy);
  }

  // 2단계: 캘리브레이션
  const fps = sampleRate / hopSize;
  const calibrationFrameCount = Math.max(1, Math.floor(calibrationSeconds * fps));

  const { barReferences } = calculateCalibration(
    rawBarsFrames,
    bassEnergies,
    calibrationFrameCount,
    barCount
  );

  // 3단계: 프레임별 처리
  const frames: number[][] = [];
  let previousBars: number[] | null = null;
  let previousBassEnergy = 0;
  let kickEnvelope = 0;

  for (let f = 0; f < rawBarsFrames.length; f++) {
    let bars = rawBarsFrames[f].map((value, i) =>
      normalizeWithLog(value, barReferences[i])
    );

    const currentBassEnergy = bassEnergies[f];
    const kick = detectKick(currentBassEnergy, previousBassEnergy, kickSensitivity);
    kickEnvelope = Math.max(kickEnvelope * 0.88, kick);

    bars = applyKickBoost(bars, kickEnvelope, barCount);
    bars = applySidechainPumping(bars, kickEnvelope, pumpingIntensity, barCount);
    bars = applyAttackDecay(bars, previousBars, attackSpeed, decaySpeed);
    bars = smoothCircular(bars, smoothing);

    const finalBars = bars.map((v) =>
      Math.round(clamp01(v) * multiplier) / multiplier
    );

    frames.push(finalBars);
    previousBars = bars;
    previousBassEnergy = currentBassEnergy;
  }

  return frames;
}
