import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {Like} from "../models/like.model.js";
import {Subscription} from "../models/subscription.model.js";

import fs from "fs/promises"; 

// GET ALL VIDEOS WITH FILTERS AND PAGINATION
const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 200,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const matchStage = { isPublished: true };

    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;

    const searchRegex = query ? new RegExp(query, "i") : null;

    const aggregatePipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },

        // ✅ Full-text search across title, description, owner's username and fullName
        ...(searchRegex
            ? [{
                $match: {
                    $or: [
                        { title: { $regex: searchRegex } },
                        { description: { $regex: searchRegex } },
                        { "ownerDetails.username": { $regex: searchRegex } },
                        { "ownerDetails.fullName": { $regex: searchRegex } }
                    ]
                }
            }]
            : []
        ),

        { $sort: sortStage },

        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                owner: "$ownerDetails.username",
                ownerAvatar: "$ownerDetails.avatar"
            }
        }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const videos = await Video.aggregatePaginate(Video.aggregate(aggregatePipeline), options);

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// PUBLISH A VIDEO
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError("Title and description are required",400);
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    

    if (!videoFileLocalPath || !thumbnailLocalPath) {
        throw new ApiError("Video file or thumbnail is missing",400);
    }
    
    const videoUrl = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath);
    console.log(thumbnailUrl)
    if (!videoUrl || !thumbnailUrl) {
        throw new ApiError("Error uploading to Cloudinary",500);
    }
   
    const video = await Video.create({
        videoFile: videoUrl,
        thumbnail: thumbnailUrl,
        title,
        description,
        duration: videoUrl.duration || 0,
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, video, "Video uploaded successfully"));
});

// GET VIDEO BY ID
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId).populate("owner", "username fullName avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  let isLiked = false;
  let isSubscribed = false;

  try {
    if (req.user?._id) {
      const [likeExists, subscriptionExists] = await Promise.all([
        Like.exists({ video: videoId, likedBy: req.user._id }),
        Subscription.exists({ channel: video.owner?._id, subscriber: req.user._id }),
      ]);
      isLiked = !!likeExists;
      isSubscribed = !!subscriptionExists;
    }
  } catch (error) {
    console.error("Error checking isLiked/isSubscribed:", error.message);
  }

  const videoData = video.toObject(); 

  videoData.isLiked = isLiked;
  videoData.isSubscribed = isSubscribed;

  return res
    .status(200)
    .json(new ApiResponse(200, videoData, "Video fetched successfully"));
});


// UPDATE VIDEO
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError("Invalid video ID",400);
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError("Video not found",404);
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError("You can only update your own videos",403);
    }

    if (title) video.title = title;
    if (description) video.description = description;

    const thumbnailPath = req.files?.thumbnail?.[0]?.path;
    if (thumbnailPath) {
        const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);
        if (thumbnailUpload) {
            video.thumbnail = thumbnailUpload;
        }
    }

    await video.save();

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

// DELETE VIDEO
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own videos");
    }

    await video.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
});

// TOGGLE PUBLISH STATUS
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own videos");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"} successfully`));
});

// INCRESE VIDEO VIEWS
const increaseVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError("Invalid video ID",400);
    }
    try {
        const updated = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { views: 1 } },
            { new: false } 
        );

        if (!updated) {
            return res
                .status(404)
                .json(new ApiResponse(404, null, "Video not found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, null, "View count incremented"));
    } catch (err) {
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Internal server error"));
    }
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    increaseVideoViews
};
