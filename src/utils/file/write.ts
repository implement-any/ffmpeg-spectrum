import fs from "fs";
import path from "path";

import { ROOT_DIR } from "./path";
import { readParseJson } from "./read";

export function writeJson(output: string, json: unknown) {
  fs.writeFileSync(path.join(ROOT_DIR, output), JSON.stringify(json));
}

export function appendWriteJson<T>(output: string, row: T) {
  const read = readParseJson<T[]>(output);
  read.push(row);
  writeJson(output, read);
}
