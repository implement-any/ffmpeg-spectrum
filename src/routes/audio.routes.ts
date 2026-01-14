import express from "express";

import {
  getAudio,
  getAudioList,
  getVisualizerBin,
  getVisualizerMeta,
} from "@/controllers/audio.controller";

const router = express.Router();

router.get("/file/list", getAudioList);

router.get("/file/:name", getAudio);

router.get("/visualizer/:name/bin", getVisualizerBin);

router.get("/visualizer/:name/meta", getVisualizerMeta);

export default router;
