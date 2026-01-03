import fs from "fs";
import path from "path";

import type { Request, Response } from "express";

export async function getAudio(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  const file = path.join(__dirname, `../assets/audio/${name}.wav`);
  const stat = fs.statSync(file);
  const size = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0]);
    const end = parts[1] !== "" ? parseInt(parts[1]) : size - 1;
    const chunk = end - start + 1;
    const stream = fs.createReadStream(file, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunk,
      "Content-Type": "audio/wav",
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": size, "Content-Type": "audio/wav" });
    fs.createReadStream(file).pipe(res);
  }
}

export async function getFrames(req: Request<{ name: string }>, res: Response) {
  const name = req.params.name;
  const json = fs.readFileSync(path.join(__dirname, `../output/${name}.json`), "utf-8");
  res.setHeader("Content-Type", "application/json");
  res.send(json);
}
