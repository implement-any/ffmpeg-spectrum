import path from "path";
import type { Request, Response } from "express";

import { generateJSON } from "@/utils/generate";
import { replace } from "@/utils/regex";
import { resize, getBlurHash } from "@/utils/image";
import { appendWriteJson, ROOT_DIR } from "@/utils/file";

export function renderPage(_: Request, res: Response) {
  res.sendFile("upload.html", { root: path.join(ROOT_DIR, "public/page") });
}

export async function generateFile(req: Request, res: Response) {
  const files = req.files as {
    audio: Express.Multer.File[];
    cover: Express.Multer.File[];
  };

  const audio = files.audio[0];
  const cover = files.cover[0];
  const title = req.body.title;
  const subTitle = req.body.sub_title;

  try {
    const audioId = replace(audio.filename, "", "mime");
    await generateJSON(audioId);
    await resize(cover);

    const blurHash = await getBlurHash(cover);
    const row = {
      audioId: audioId,
      cover: `/cover/${cover.filename}`,
      blurHash: blurHash,
      title: title,
      subTitle: subTitle,
    };

    appendWriteJson("/public/db/music.json", row);
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ message: "파일 업로드에 실패하였습니다." });
  }
}
