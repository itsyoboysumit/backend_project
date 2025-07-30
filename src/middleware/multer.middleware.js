import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/temp');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const isImage =
    ['thumbnail', 'avatar', 'coverImage'].includes(file.fieldname) &&
    file.mimetype.startsWith('image/');
  const isVideo = file.fieldname === 'videoFile' && file.mimetype.startsWith('video/');

  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new ApiError("Invalid file type: only video and image files are allowed", 400), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter
});
