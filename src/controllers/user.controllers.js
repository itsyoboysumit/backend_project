import {asyncHandler} from '../utils/AsyncHandler.js';
import {ApiError} from '../utils/ApiError.js'; // used to throw errors in asyncHandler
import {cloudinaryUpload} from '../utils/cloudinary.js'; // utility to upload files on cloudinary
import User from '../models/user.model.js'; // user model to interact with user collection in DB
import {ApiResponse} from '../utils/ApiResponse.js'; // utility to send API responses
const registerUser = asyncHandler(async (req, res) => {
    // Logic for registering a user
    // get user detail fron frontend
    // validation - not empty
    // check if user already exists ( using mail and username)
    // check files ( avatar and cover image)
    // upload them on cloudinary ( avatar )
    // create user object - careate entry on DB 
    // remove password and refresh token from response 
    // check for user creation 
    // return rsponse

    //get user details from frontend
    const {fullName, username, email, password} = req.body;
    console.log("emal:", email);    

    // validation stage
    if ([fullName, username, email, password].some((field) => field?.trim() === '')) {
        throw new ApiError('All fields are required', 400);
    }

    // check if user already exists
    const existedUser = await User.findOne({$or: [{email}, {username}]});
    if(existedUser) {
        throw new ApiError('User already exists',409);
    }   

    // handle file uploads
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath) {
        throw new ApiError('Avatar is required', 400);
    }   

    // upload files on cloudinary 
    const avatarUrl = await cloudinaryUpload(avatarLocalPath);
    const coverImageUrl = await cloudinaryUpload(coverImageLocalPath);

    if(!avatarUrl) {
        throw new ApiError('Failed to upload avatar', 500);
    }

    // create user object and enter data to DB
    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        email,
        password,
        username: username.toLowerCase(),

    });

    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select('-password -refreshToken');
    if(!createdUser) {
        throw new ApiError('User creation failed', 500);
    }

    //return response 
    return res.status(201).json(
        new ApiResponse(201, createdUser, 'User registered successfully')
    );
});

export {registerUser};