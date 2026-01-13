import fs from "fs";
import path from "path";

import { extract } from "@/utils/pcm";
import { createFrames } from "@/utils/generate";
import { ROOT_DIR } from "@/utils/file";

export async function generateJSON(name: string) {
  const assets = path.join(ROOT_DIR, `/public/audio/${name}.wav`);
  const output = path.join(ROOT_DIR, `/public/json/${name}.json`);

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
