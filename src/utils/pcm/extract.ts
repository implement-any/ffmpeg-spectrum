import stream from "stream";
import ffmpeg from "fluent-ffmpeg";

import type { Executor, Writable } from "./extract.type";

export function extract(path: string, sampleRate: number = 44100): Promise<number[]> {
  const promise: Executor<number[]> = (resolve, reject) => {
    const samples: number[] = [];

    const write: Writable = (chunk, _, callback) => {
      for (let i = 0; i < chunk.length; i += 4) {
        samples.push(chunk.readFloatLE(i));
      }

      callback(); // 함수 종료
    };

    const chunkLE = new stream.Writable({ write });

    ffmpeg(path)
      .outputOption(["-f f32le", "-ac 1", `-ar ${sampleRate}`])
      .on("error", reject)
      .pipe(chunkLE)
      .on("finish", () => resolve(samples));
  };

  return new Promise<number[]>(promise);
}
