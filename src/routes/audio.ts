import express, { Request } from "express";

import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/:name", async (req: Request<{ name: string }>, res) => {
  const name = req.params.name;
  const jsonFile = fs.readFileSync(path.join(__dirname, `../output/${name}.json`), "utf-8");
  res.setHeader("Content-Type", "application/json");
  res.send(jsonFile);
});

export default router;
