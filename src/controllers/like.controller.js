import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Helper function to toggle like
const toggleLike = async ({ contentType, contentId, userId }) => {
    const filter = {
        likedBy: userId,
        video: null,
        comment: null,
        tweet: null
    };
    filter[contentType] = contentId;

    const existingLike = await Like.findOne(filter);

    if (existingLike) {
        await existingLike.deleteOne();
        return { liked: false };
    }

    const newLike = new Like({
        likedBy: userId,
        video: null,
        comment: null,
        tweet: null
    });
    newLike[contentType] = contentId;
    await newLike.save();

    return { liked: true };
};

// Toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const result = await toggleLike({
        contentType: "video",
        contentId: videoId,
        userId: req.user._id
    });

    res.status(200).json(
        new ApiResponse(200, result, "Video like toggled")
    );
});

// Toggle like on comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const result = await toggleLike({
        contentType: "comment",
        contentId: commentId,
        userId: req.user._id
    });

    res.status(200).json(
        new ApiResponse(200, result, "Comment like toggled")
    );
});

// Toggle like on tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const result = await toggleLike({
        contentType: "tweet",
        contentId: tweetId,
        userId: req.user._id
    });

    res.status(200).json(
        new ApiResponse(200, result, "Tweet like toggled")
    );
});

// Get all liked videos by the logged-in user
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.find({
        likedBy: userId,
        video: { $ne: null }
    })
    .populate({
        path: "video",
        populate: {
            path: "owner",
            select: "username avatar",
        },
    });

    // Transform the response to flatten owner info into video object
    const transformed = likedVideos.map(like => {
        const video = like.video;
        const ownerData = video?.owner;

        return {
            ...like.toObject(),
            video: {
                ...video.toObject(),
                owner: ownerData?.username || null,
                ownerAvatar: ownerData?.avatar || null,
            },
        };
    });

    res.status(200).json(
        new ApiResponse(200, transformed, "Liked videos fetched successfully")
    );
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};
