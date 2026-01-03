import ws from "ws";
import fs from "fs";
import url from "url";
import path from "path";

export function socketConnection(ws: ws, req: Request) {
  const name = url.parse(req.url, true).query.name;
  const json = JSON.parse(fs.readFileSync(path.join(__dirname, `../output/${name}.json`), "utf-8"));

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
