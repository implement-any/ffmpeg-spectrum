import express from "express";

import { renderPage, generateFile } from "@/controllers/upload.controller";

import { upload } from "@/config";

const router = express.Router();

router.get("/", renderPage);

router.post("/generate", upload.single("audio"), generateFile);

export default router;
