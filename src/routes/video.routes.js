import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  increaseVideoViews
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"
import {upload} from "../middleware/multer.middleware.js"
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';

const router = Router();
router.route("/").get(getAllVideos);
router.route("/:videoId").get(optionalAuth,getVideoById);
router.route("/views/:videoId").patch(increaseVideoViews);
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

router
    .route("/:videoId")
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
