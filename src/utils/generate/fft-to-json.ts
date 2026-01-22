import fs from "fs";
import path from "path";

import { extract } from "@/utils/pcm";
import { createFrames, u8ToBin } from "@/utils/generate";
import { ROOT_DIR } from "@/utils/file";

export async function generateJSON(name: string) {
  const assets = path.join(ROOT_DIR, `/public/audio/${name}.wav`);
  const output = path.join(ROOT_DIR, `/public/json/${name}.meta.json`);
  const outbin = path.join(ROOT_DIR, `/public/json/${name}.bin`);

  const pcm = await extract(assets);

  console.log("✅ Success extract PCM: ", pcm.length);

  const fftOptions = {
    fftSize: 1024,
    hopSize: 512,
    barCount: 64,
    sampleRate: 44100,
    minHz: 40,
    maxHz: 16000,
  };

  const frames = createFrames(pcm, fftOptions);

  console.log("✅ Generated frame size: ", frames.length);

  const result = {
    ...fftOptions,
    version: 1,
    format: "u8",
    fps: fftOptions.sampleRate / fftOptions.hopSize,
    frameCount: frames.length,
    frameDurationMs: (fftOptions.hopSize / fftOptions.sampleRate) * 1000,
  };

  const bin = u8ToBin(frames, result.barCount);

  fs.writeFileSync(output, JSON.stringify(result, null, 2), "utf-8");
  console.log("✅ Done:", output);

  fs.writeFileSync(outbin, bin);
  console.log("✅ Done:", outbin);
}
