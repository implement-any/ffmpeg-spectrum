import fs from "fs";
import path from "path";

import { extract } from "@/utils/pcm";
import { createFrames } from "@/utils/generate";

export async function generateJSON(name: string) {
  const assets = path.join(__dirname, `../../assets/audio/${name}.wav`);
  const output = path.join(__dirname, `../../output/${name}.json`);

  const pcm = await extract(assets);

  console.log("✅ Success extract PCM: ", pcm.length);

  const frames = createFrames(pcm, {
    fftSize: 1024,
    hopSize: 512,
    barCount: 64,
  });

  console.log("✅ Generated frame size: ", frames.length);

  const result = {
    audio: path.basename(assets),
    fps: 44100 / 512,
    bars: 64,
    frames,
  };

  fs.writeFileSync(output, JSON.stringify(result));
  console.log("✅ Done:", output);
}
