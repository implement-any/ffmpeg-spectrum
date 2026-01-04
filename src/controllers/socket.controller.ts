import ws from "ws";

import type { Frames } from "./audio.controller.type";
import type { SocketParameter } from "./socket.controller.type";

import { readParseJson, getQuery } from "@/utils";

export function socketConnection(ws: ws, req: Request) {
  const name = getQuery<SocketParameter>(req).name;
  const json = readParseJson<Frames>(`output/${name}.json`);

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
