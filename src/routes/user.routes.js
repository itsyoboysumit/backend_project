import express from 'express';
import {registerUser, loginUser, logoutUser} from '../controllers/user.controllers.js';
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
router.route("/logout").post(verifyJWT, logoutUser)

export {router as userRouter};