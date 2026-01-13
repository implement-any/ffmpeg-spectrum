import fs from "fs";
import path from "path";
import sharp from "sharp";

export async function resize(file: Express.Multer.File) {
  const ext = path.extname(file.path);
  const tmp = file.path.replace(ext, `.tmp${ext}`);
  await sharp(file.path).resize(512).jpeg({ quality: 90 }).toFile(tmp);
  fs.renameSync(tmp, file.path);
}
