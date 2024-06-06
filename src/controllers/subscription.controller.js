import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { subscribe } from "./user.controller.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const channel = await User.findOne({ username: channelId });
    if (!channel) {
        throw new ApiError(404, "channel not found");
    }

    const alreadySubscribed = await Subscription.findOneAndDelete(
        {
        channel: channel?._id,
        subscriber: req?.user?._id,
        }
).select("-__v");
    if (alreadySubscribed) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    alreadySubscribed,
                    "channel has been unsubscribed"
                )
            );
    }

    const subscribing = await Subscription.create({
        subscriber: req?.user?._id,
        channel: channel?._id,
    });

    if (!subscribing) {
        throw new ApiError(
            500,
            "something went wrong while subscribing the channel"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribing,
                `${channelId} has been subscribed by ${req?.user?.username || "unknown"}`
            )
        );
});


// controller to return subscriber list of a channel
const subscriberListOfChannel = asyncHandler(async (req, res) => {
    const { subscriberId } = req?.params;
    const channel = await User.findOne({ username: subscriberId || "" });

    if (!channel) {
        throw new ApiError(
            404,
            `no channel found with this username ${subscriberId}`
        );
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match: {
                subscriber: channel._id,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribed",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $set: {
                subscribed: { $first: "$subscribed" },
            },
        },
        {
            $project: {
                subscriber: 1,
                channel: 1,
                subscribed: 1,
                _id: 0,
            },
        },
    ]);

    if (!subscriberList?.length > 0) {
        throw new ApiError(
            404,
            `No subcribed channel found for ${subscriberId || "default"}`
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscriberList,
                "subscriber list fetched successfully"
            )
        );
});


// controller to return channel list to which user has subscribed
const subscribedChannelListOfUser = asyncHandler(async (req, res) => {
    const { channelId } = req?.params;

    const channel = await User.findOne({ username: channelId });

    if (!channel) {
        throw new ApiError(400, `No channel found this username ${channel}`);
    }

    const subscribedList = await Subscription.aggregate([
        {
            $match: {
                subscriber: channel._id,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
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
            $project: {
                _id: 0,
                channel: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedList,
                "user subscribed channel is fetched successfully"
            )
        );
});

const test = asyncHandler(async (req, res) => {
    // const tem
    // const {channelId} = req.params
    // console.log(channelId);
    // const temper = await Subscription.findOne({
    //     channel : channelId,
    //     subscriber : req?.user?._id
    // })
    // console.log(temper);
});
export {
    toggleSubscription,
    subscriberListOfChannel,
    subscribedChannelListOfUser,
    test,
};
