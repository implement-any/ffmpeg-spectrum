import ws from "ws";

import type { Frames } from "./audio.controller.type";
import type { SocketParameter } from "./socket.controller.type";

import { readParseJson } from "@/utils/file";
import { getQuery } from "@/utils/parse";

export function socketConnection(ws: ws, req: Request) {
  const name = getQuery<SocketParameter>(req).name;
  const json = readParseJson<Frames>(`/public/json/${name}.json`);

  let index = 0;

  const interval = setInterval(() => {
    if (index < json.frames.length) {
      ws.send(JSON.stringify(json.frames[index]));
      index++;
    } else {
      clearInterval(interval);
    }
  }, 1000 / json.fps);
}
