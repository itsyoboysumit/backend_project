import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Get all comments for a video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const result = await Comment.aggregatePaginate(
        Comment.aggregate([
            { $match: { video: new mongoose.Types.ObjectId(videoId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                },
            },
            { $unwind: "$ownerDetails" },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    "ownerDetails._id": 1,
                    "ownerDetails.username": 1,
                    "ownerDetails.avatar": 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]),
        {
            page: parseInt(page),
            limit: parseInt(limit),
        }
    );

    return res.status(200).json(
        new ApiResponse(200, result, "Comments fetched successfully")
    );
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,
    });

    return res.status(201).json(
        new ApiResponse(201, newComment, "Comment added successfully")
    );
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content = content || comment.content;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
};
