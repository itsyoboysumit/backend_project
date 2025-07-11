import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Toggle subscription (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId.trim();
    const userId = req.user._id;

    if (userId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    if (existingSubscription) {
        await existingSubscription.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, {}, "Unsubscribed from channel")
        );
    } else {
        await Subscription.create({
            subscriber: userId,
            channel: channelId,
        });

        return res.status(201).json(
            new ApiResponse(201, {}, "Subscribed to channel")
        );
    }
});


// Get all subscribers of a channel (i.e., users who subscribed to the given user)
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const rawSubscriberId = req.params.subscriberId;
    const subscriberId = rawSubscriberId.trim(); // remove any accidental whitespace or \n

    if (!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscribers = await Subscription.find({ channel: subscriberId })
        .populate("subscriber", "username fullName avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscriber list fetched")
    );
});

// Get all channels to which a user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const rawChannelId = req.params.channelId;
    const channelId = rawChannelId.trim();

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const channels = await Subscription.find({ subscriber: channelId })
        .populate("channel", "username fullName avatar")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, channels, "Subscribed channels fetched")
    );
});
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
