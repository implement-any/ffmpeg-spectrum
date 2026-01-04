import type { Request, Response } from "express";

export function renderPage(_: Request, res: Response) {
  res.sendFile("upload.html", { root: "public/page" });
}
