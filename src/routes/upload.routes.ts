import express from "express";

import { renderPage, generateFile } from "@/controllers/upload.controller";

import { upload } from "@/config";

const router = express.Router();

router.get("/", renderPage);

router.post(
  "/generate",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  generateFile
);

export default router;
