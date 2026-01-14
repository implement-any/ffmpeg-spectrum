import type { Request, Response } from "express";
import type { Frames } from "./audio.controller.type";
import type { Music } from "./upload.controller.type";

import { readFile, readParseJson, readStat, readStream } from "@/utils/file";

export async function getAudio(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  const dest = `/public/audio/${name}.wav`;
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

export async function getAudioList(_: Request, res: Response) {
  const files = readParseJson<Music[]>("/public/db/music.json");
  res.setHeader("Content-Type", "application/json");
  res.json(files);
}

export async function getVisualizerBin(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  res.setHeader("Content-Type", "application/octet-stream");
  readStream(`/public/json/${name}.bin`).pipe(res);
}

export async function getVisualizerMeta(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  const json = readParseJson<Frames>(`/public/json/${name}.meta.json`);
  res.setHeader("Content-Type", "application/json");
  res.json(json);
}
