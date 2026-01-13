import multer from "multer";

import { replace } from "@/utils/regex";

const storage = multer.diskStorage({
  destination: (_, file, callback) => {
    if (file.fieldname == "audio") {
      callback(null, "public/audio");
    } else if (file.fieldname == "cover") {
      callback(null, "public/cover");
    }
  },
  filename: (_, file, callback) => {
    const name = file.originalname;
    const removeSPACE = replace(name, "_", "space");
    callback(null, removeSPACE.toLowerCase());
  },
});

export const upload = multer({ storage });
