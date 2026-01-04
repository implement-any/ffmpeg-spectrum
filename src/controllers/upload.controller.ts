import type { Request, Response } from "express";

import { generateJSON } from "@/utils";

export function renderPage(_: Request, res: Response) {
  res.sendFile("upload.html", { root: "public/page" });
}

export async function generateFile(req: Request, res: Response) {
  const { file } = req;

  try {
    await generateJSON(
      `../../assets/audio/${file?.originalname}`,
      `../../output/${file?.originalname}`
    );
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ message: "파일 업로드에 실패하였습니다." });
  }
}
