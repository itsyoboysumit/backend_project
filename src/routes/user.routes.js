import express from 'express';
import {
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory, 
    updateAccountDetails,
    addToWatchHistory
} from '../controllers/user.controller.js';
import {upload} from '../middleware/multer.middleware.js'; // to upload files using middleware
import {verifyJWT} from '../middleware/auth.middleware.js';

const router = express.Router();
router.route('/register').post(
    upload.fields([
        {name: 'avatar', maxCount: 1}, // single file upload for avatar
        {name: 'coverImage', maxCount: 1} // single file upload for cover image
    ]),
    registerUser
);
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)
router.route("/history/:videoId").post(verifyJWT, addToWatchHistory);
export default router