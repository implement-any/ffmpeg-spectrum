/** FFT 기반 오디오 시각화 설정 */
export interface FFTOptions {
  /** FFT 윈도우 크기 (2의 거듭제곱) */
  fftSize?: number;
  /** 프레임 간 샘플 간격 */
  hopSize?: number;
  /** 시각화 바 개수 */
  barCount?: number;
  /** 오디오 샘플레이트 */
  sampleRate?: number;
  /** 표시할 최소 주파수 Hz */
  minHz?: number;
  /** 표시할 최대 주파수 Hz */
  maxHz?: number;
  /** 킥 감지 민감도 */
  kickSensitivity?: number;
  /** 사이드체인 펌핑 강도 */
  pumpingIntensity?: number;
  /** 저역대 부스트 배율 */
  bassBoost?: number;
  /** Attack 속도 (상승 반응) */
  attackSpeed?: number;
  /** Decay 속도 (하강 반응) */
  decaySpeed?: number;
  /** 원형 스무딩 강도 */
  smoothing?: number;
  /** 캘리브레이션 시간 (초) */
  calibrationSeconds?: number;
  /** 출력 소수점 자리수 */
  compactDigits?: number;
}

/** 주파수 대역 설정 */
export interface FrequencyBand {
  /** 주파수 범위 [min, max] Hz */
  range: [number, number];
  /** 해당 대역 부스트 배율 */
  boost: number;
  /** Decay 속도 */
  decay: number;
}
