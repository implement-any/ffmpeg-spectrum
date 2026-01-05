import multer from "multer";

import { replace } from "@/utils/regex";

const storage = multer.diskStorage({
  destination: (_, __, callback) => {
    callback(null, "src/assets/audio");
  },
  filename: (_, file, callback) => {
    const name = file.originalname;
    const removeSPACE = replace(name, "_", "space");
    callback(null, removeSPACE.toLowerCase());
  },
});

export const upload = multer({ storage });
