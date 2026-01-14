import fs from "fs";
import path from "path";

import { ROOT_DIR } from "./path";
import { readParseJson } from "./read";

export function writeJson(output: string, json: unknown) {
  fs.writeFileSync(path.join(ROOT_DIR, output), JSON.stringify(json));
}

export function appendWriteJson<T>(output: string, row: T, search: (arr: T) => boolean) {
  const read = readParseJson<T[]>(output);
  const exist = read.find(search);
  if (!exist) read.push(row);
  writeJson(output, read);
}
