import path from "path";
import fs from "fs";

import { ROOT_DIR } from "@/utils/file";

export function readDir(dest: string): string[] {
  return fs.readdirSync(path.join(ROOT_DIR, dest));
}

export function readFile(dest: string): string {
  return fs.readFileSync(path.join(ROOT_DIR, dest), "utf-8");
}

export function readStat(dest: string): fs.Stats {
  return fs.statSync(path.join(ROOT_DIR, dest));
}

export function readStream(dest: string, options?: fs.ReadStreamOptions): fs.ReadStream {
  return fs.createReadStream(`${path.join(ROOT_DIR, dest)}`, options);
}

export function readParseJson<T>(file: string): T {
  return JSON.parse(readFile(file));
}
