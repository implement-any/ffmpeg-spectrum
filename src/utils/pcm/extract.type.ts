export type Executor<T> = (
  resolve: (value: T | PromiseLike<T>) => void,
  reject: (reason?: unknown) => void
) => void;

export type Writable = (
  chunk: Buffer,
  encoding: BufferEncoding,
  callback: (error?: Error | null) => void
) => void;
