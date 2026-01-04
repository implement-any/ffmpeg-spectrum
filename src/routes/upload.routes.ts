import express from "express";

import { renderPage } from "@/controllers/upload.controller";

const router = express.Router();

router.get("/", renderPage);

export default router;
