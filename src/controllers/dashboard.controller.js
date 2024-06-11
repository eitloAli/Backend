import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {

    const channelStats = await Video.aggregate([
        {
            $match: {
                owner: req?.user?._id,
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            _id: 0,
                        },
                    },
                ],
            },
        },
        {
            $set: {
                channel: { $first: "$channel" },
            },
        },
        {
            $set: {
                channel: "$channel.username",
            },
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                        },
                    },
                ],
            },
        },
        {
            $set: {
                videoLikes: { $size: "$videoLikes" },
            },
        },

        {
            $project: {
                videoFile: 0,
                description: 0,
                isPublished: 0,
                __v: 0,
                updatedAt: 0,
            },
        },

        {
            $group: {
                _id: null,
                allVideos: {
                    $push: "$$ROOT",
                },
                totalViews: {
                    $sum: "$views",
                },
                totalLikes: { $sum: "$videoLikes" },
                ownerId: { $first: "$owner" },
            },
        },

        {
            $unwind: "$allVideos",
        },
        {
            $project: {
                "allVideos.videoLikes": 0,
                "allVideos.owner": 0,
            },
        },
        {
            $group: {
                _id: null,
                allVideos: { $push: "$allVideos" },
                totalViews: { $first: "$totalViews" },
                totalLikes: { $first: "$totalLikes" },
                ownerId: { $first: "$ownerId" },
            },
        },

        {
            $set: {
                totalVideoCount: { $size: "$allVideos" },
            },
        },

        {
            $lookup: {
                from: "subscriptions",
                localField: "ownerId",
                foreignField: "channel",
                as: "totalSubscriber",
            },
        },
        {
            $set: {
                totalSubscriber: { $size: "$totalSubscriber" },
            },
        },
        {
            $project: {
                _id: 0,
            },
        },
    ]);
    return res
            .status(200)
            .json(new ApiResponse(
                200,
                channelStats[0],
                "channel stats fetched successfully"
            ))
});
export { getChannelStats };
