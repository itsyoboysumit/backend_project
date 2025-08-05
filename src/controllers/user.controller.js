import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js"; 
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 
import { User } from "../models/user.model.js"; 
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {v2 as cloudinary} from 'cloudinary';  
import { sendEmail } from "../utils/SendEmail.js"
import crypto from "node:crypto"

//GENERATE TOKENS 
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token in database 
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
 
  //get user details from frontend
  const { fullName, username, email, password } = req.body;
  

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
  const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
  const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

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
    
    const isPasswordValid = await user.isPasswordValid(password)
    if(!isPasswordValid){
        throw new ApiError("Invalid user credentials",401)
    }

    const{accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
  };

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
    secure: true,
    sameSite: "None",
    path: "/",
  };
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

// REFRESH TOKEN
const refreshAccessToken = asyncHandler(async (req, res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError("unauthrorized request",401)
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    
    if(!user){
      throw new ApiError("Invalid refresh token")
    }

    if(incomingRefreshToken!=user?.refreshToken){
      throw new ApiError("Refresh token is expired or used",401)
    }

    const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/", 
  };
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie("refreshToken", refreshToken , options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: refreshToken},
        "Access token refrehsed"
      )
    )
  }catch (error){
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
})

//CHANGE PASSWORD 
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordValid(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError("Invalid old password",404)
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

//GET CURRENT USER
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})


// UPDATE ACCOUNT DETAIL 
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError("At least one field must be provided", 400);
  }

  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (email) updateData.email = email;

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: updateData },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

//UPDATE USER AVATAR 
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError("Avatar file is missing",400);
    }

    // STEP 1: Get current user
    const user = await User.findById(req.user?._id);

    // STEP 2: If previous avatar exists, delete it from Cloudinary
    if (user?.avatar) {
        // Extract public_id from the URL
        const publicId = user.avatar.split("/").pop().split(".")[0]; // e.g. get 'abc123' from '.../abc123.jpg'
        
        await cloudinary.uploader.destroy(publicId);
    }

    // STEP 3: Upload new avatar
    const avatarUrl = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarUrl) {
        throw new ApiError("Error while uploading avatar",404);
    }

    // STEP 4: Update user with new avatar URL
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar : avatarUrl,
            },
        },
        { new: true }
    ).select("-password");

    // STEP 5: Respond
    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Avatar image updated successfully")
    );
});

// UPDATRE COVER IMAGE 
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError("Cover image file is missing",404);
    }

    // STEP 1: Get current user
    const user = await User.findById(req.user?._id);

    // STEP 2: If previous cover image exists, delete it from Cloudinary
    if (user?.coverImage) {
        const publicId = user.coverImage.split("/").pop().split(".")[0];

        await cloudinary.uploader.destroy(publicId);
    }

    // STEP 3: Upload new cover image
    const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImageUrl) {
        throw new ApiError("Error while uploading cover image",404);
    }

    // STEP 4: Update user with new cover image URL
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImageUrl,
            },
        },
        { new: true }
    ).select("-password");

    // STEP 5: Respond
    return res.status(200).json(
        new ApiResponse(200, updatedUser, "Cover image updated successfully")
    );
});

//GET USER CHANNEL PROFILE 
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError("username is missing",404)
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError("channel does not exists",404)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

// GET WATCH HISTORY
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: { $first: "$owner.username" },
              ownerAvatar: { $first: "$owner.avatar" }
            }
          },
          {
            $project: {
              _id: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              isPublished: 1,
              createdAt: 1,
              owner: 1,
              ownerAvatar: 1
            }
          }
        ]
      }
    },
    {
      $project: {
        _id: 0,
        watchHistory: 1
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0]?.watchHistory || [],
      "Watch history fetched successfully"
    )
  );
});


// ADD TO WATCH HISTORY
const addToWatchHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const videoId = req.params.videoId;
  console.log("Adding video to watch history:", videoId, userId);

  await User.findByIdAndUpdate(userId, {
    $addToSet: { watchHistory: videoId } // prevents duplicates
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Video added to watch history")
  );
});

// FORGOT PASSWORD 

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError("Email is required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError("User not found with this email", 404);
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const message = `
    <h1>Password Reset Request</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetUrl}" target="_blank">${resetUrl}</a>
    <p>This link will expire in 10 minutes.</p>
  `;

  try {
    await sendEmail(user.email, "Password Reset", message);
    return res.status(200).json(
      new ApiResponse(200, {}, "Password reset link sent to email")
    );
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError("Error sending email. Please try again later.", 500);
  }
});

// RESET PASSWORD 
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const { password } = req.body;

  if (!token || !password) {
    throw new ApiError("Token and new password are required", 400);
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError("Invalid or expired token", 400);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password has been reset successfully")
  );
});



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    addToWatchHistory,
    forgotPassword,
    resetPassword
}
