import fs from "fs";
import path from "path";

import { extract, createFrames } from "@/utils";

export async function generateJSON(origin: string, destination: string) {
  const assets = path.join(__dirname, origin);
  const output = path.join(__dirname, destination);

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

  fs.writeFileSync(`${output}.json`, JSON.stringify(result));
  console.log("✅ Done:", output);
}
