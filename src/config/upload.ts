import multer from "multer";

const storage = multer.diskStorage({
  destination: (_, __, callback) => {
    callback(null, "src/assets/audio");
  },
  filename: (_, file, callback) => {
    callback(null, file.originalname);
  },
});

export const upload = multer({ storage });
