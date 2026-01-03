import fs from "fs";
import path from "path";

import { extract, createFrames } from "@/utils";

export async function generateJSON(origin: string, destination: string) {
  const pcm = await extract(origin);

  console.log("✅ Success extract PCM: ", pcm.length);

  const frames = createFrames(pcm, {
    fftSize: 1024,
    hopSize: 512,
    barCount: 64,
  });

  console.log("✅ Generated frame size: ", frames.length);

  const result = {
    audio: path.basename(origin),
    fps: 44100 / 512,
    bars: 64,
    frames,
  };

  fs.writeFileSync(destination, JSON.stringify(result));
  console.log("✅ Done:", destination);
}
