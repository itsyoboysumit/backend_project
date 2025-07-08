import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; // used to throw errors in asyncHandler
import { cloudinaryUpload } from "../utils/cloudinary.js"; // utility to upload files on cloudinary
import { User } from "../models/user.model.js"; // user model to interact with user collection in DB
import { ApiResponse } from "../utils/ApiResponse.js"; // utility to send API responses
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//GENERATE TOKENS 
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      "Something went wrong while generating refresh and access token",
      500
    );
  }
};


// REGISTER
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
  const { fullName, username, email, password } = req.body;
  console.log("email:", email);

  // validation stage
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError("All fields are required", 400);
  }

  // check if user already exists
  const existedUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existedUser) {
    throw new ApiError("User already exists", 409);
  }

  // handle file uploads
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError("Avatar is required", 400);
  }

  // upload files on cloudinary
  const avatarUrl = await cloudinaryUpload(avatarLocalPath);
  const coverImageUrl = await cloudinaryUpload(coverImageLocalPath);

  if (!avatarUrl) {
    throw new ApiError("Failed to upload avatar", 500);
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
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError("User creation failed", 500);
  }

  //return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

//LOGIN
const loginUser = asyncHandler(async (req, res) =>{
    //req data from body 
    // username or email
    // find the user 
    // if user exist check for password 
    // if everything is correct
    // generate refresh token 
    // send cookies
    const {email, username, password} = req.body

    if(!(username || email)){
        throw new ApiError("username or email is required", 400)
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError("User does not exist", 404)
    }
    
    const isPasswordValid = await user.isPasswordValid
    if(!isPasswordValid){
        throw new ApiError("Invalid user credentials",401)
    }

    const{accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "Uer logged In Successfully"
        )
    )
})

// LOGOUT 
const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

// REFRESH TOKEN


export { registerUser, loginUser, logoutUser};
