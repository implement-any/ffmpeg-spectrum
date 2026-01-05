import type { Request, Response } from "express";

import { generateJSON } from "@/utils/generate";
import { replace } from "@/utils/regex";

export function renderPage(_: Request, res: Response) {
  res.sendFile("upload.html", { root: "public/page" });
}

export async function generateFile(req: Request, res: Response) {
  const file = req.file;
  const name = file!.originalname;

  try {
    const origin = replace(name, "", "mime");
    const toSave = replace(origin, "_", "space");
    await generateJSON(origin, toSave.toLowerCase());
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ message: "파일 업로드에 실패하였습니다." });
  }
}
