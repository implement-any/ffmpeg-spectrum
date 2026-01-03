import express from "express";

import { getFrames, getAudio } from "@/controllers/audio.controller";

const router = express.Router();

router.get("/file/:name", getAudio);

router.get("/visualizer/:name", getFrames);

export default router;
