import type { Request, Response } from "express";
import type { Frames } from "./audio.controller.type";

import { readFile, readParseJson, readStat, readStream } from "@/utils/file";

export async function getAudio(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  const dest = `assets/audio/${name}.wav`;
  const stat = readStat(dest);
  const size = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0]);
    const end = parts[1] !== "" ? parseInt(parts[1]) : size - 1;
    const chunk = end - start + 1;
    const stream = readStream(dest, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunk,
      "Content-Type": "audio/wav",
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": size, "Content-Type": "audio/wav" });
    readStream(dest).pipe(res);
  }
}

export async function getVisualizer(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  const json = readFile(`assets/json/${name}.json`);
  res.setHeader("Content-Type", "application/json");
  res.send(json);
}

export async function getVisualizerInfo(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  const json = readParseJson<Frames>(`assets/json/${name}.json`);
  res.setHeader("Content-Type", "application/json");
  res.json({ audio: json.audio, fps: json.fps, bars: json.bars });
}
