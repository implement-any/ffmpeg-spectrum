import path from "path";
import type { Request, Response } from "express";

import { generateJSON } from "@/utils/generate";
import { replace } from "@/utils/regex";

export function renderPage(_: Request, res: Response) {
  res.sendFile("upload.html", { root: path.resolve(__dirname, "../../public/page") });
}

export async function generateFile(req: Request, res: Response) {
  const name = req.file!.filename;

  try {
    await generateJSON(replace(name, "", "mime"));
    res.sendStatus(200);
  } catch (e) {
    res.status(500).json({ message: "파일 업로드에 실패하였습니다." });
  }
}
