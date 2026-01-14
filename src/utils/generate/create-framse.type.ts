export interface FFTOptions {
  fftSize?: number;
  hopSize?: number;
  barCount?: number;

  sampleRate?: number; // WAV라면 보통 44100
  minHz?: number; // 40~80 추천 (너무 낮으면 저역 노이즈 들썩임)
  maxHz?: number; // 16000~20000 (샘플레이트에 따라 Nyquist 제한)

  attack?: number; // 0.6~0.9
  release?: number; // 0.05~0.25 (느리게 내려가게)

  emaAlpha?: number; // 0.2~0.4 (잔떨림 제거)
  calibrationSeconds?: number; // p95 스케일링용: 초반 N초로 기준잡기 (5~10 추천)

  compactDigits?: number; // 저장/전송용 소수점 자리 (예: 3)
}
