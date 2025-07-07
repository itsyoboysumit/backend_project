import express from 'express';
import {registerUser} from '../controllers/user.controllers.js';
import {upload} from '../middlewares/upload.js'; // to upload files using middleware

const router = express.Router();
router.route('/register').post(
    upload.fields([
        {name: 'avatar', maxCount: 1}, // single file upload for avatar
        {name: 'coverImage', maxCount: 1} // single file upload for cover image
    ]),
    registerUser);

export {router as userRouter};