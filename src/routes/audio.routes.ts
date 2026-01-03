import express from "express";

import { getAudio, getVisualizer, getVisualizerInfo } from "@/controllers/audio.controller";

const router = express.Router();

router.get("/file/:name", getAudio);

router.get("/visualizer/info/:name", getVisualizerInfo);

router.get("/visualizer/:name", getVisualizer);

export default router;
