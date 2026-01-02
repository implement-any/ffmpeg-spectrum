import stream from "stream";
import ffmpeg from "fluent-ffmpeg";

export function extract(path: string, sampleRate: number = 44100): Promise<number[]> {
  type Executor<T> = (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: unknown) => void
  ) => void;

  const promise: Executor<number[]> = (resolve, reject) => {
    const samples: number[] = [];

    const chunkLE = new stream.Writable({
      write(chunk: Buffer, _, callback) {
        for (let i = 0; i < chunk.length; i += 4) {
          samples.push(chunk.readFloatLE(i));
        }
        callback();
      },
    });

    ffmpeg(path)
      .outputOption(["-f f32le", "-ac 1", `-ar ${sampleRate}`])
      .on("error", reject)
      .pipe(chunkLE)
      .on("finish", () => resolve(samples));
  };

  return new Promise<number[]>(promise);
}
