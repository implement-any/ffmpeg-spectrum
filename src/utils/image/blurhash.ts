import sharp from "sharp";
import { encode } from "blurhash";

export async function getBlurHash(
  file: Express.Multer.File,
  componentX: number = 4,
  componentY: number = 4
) {
  const { data, info } = await sharp(file.path)
    .resize(32)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  return encode(new Uint8ClampedArray(data), info.width, info.height, componentX, componentY);
}
