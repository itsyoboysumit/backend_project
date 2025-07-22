import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/AsyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const [totalVideos, totalViewsResult, totalSubscribers, totalLikes] = await Promise.all([
        Video.countDocuments({ owner: userId }),
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]),
        Subscription.countDocuments({ channel: userId }),
        Like.countDocuments({ likedBy: userId })
    ])

    const totalViews = totalViewsResult.length > 0 ? totalViewsResult[0].totalViews : 0

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }, "Channel statistics fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rawVideos = await Video.find({ owner: userId })
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 });

  const videos = rawVideos.map(video => ({
    _id: video._id,
    videoFile: video.videoFile,
    thumbnail: video.thumbnail,
    title: video.title,
    description: video.description,
    duration: video.duration,
    views: video.views,
    isPublished: video.isPublished,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    owner: video.owner?.username || null,
    ownerAvatar: video.owner?.avatar || null,
  }));

  return res.status(200).json(
    new ApiResponse(200, videos, "Channel videos fetched successfully")
  );
});



export {
    getChannelStats,
    getChannelVideos
}
