import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
    const { tweet } = req.body;

    if (!tweet?.trim()) {
        throw new ApiError(400, "Tweet is required");
    }

    const postedTweet = await Tweet.create({
        owner: req.user._id,
        tweet: String(tweet),
    });

    if (!postedTweet) {
        throw new ApiError(
            500,
            "something went wrong from our side while uploading tweet"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                postedTweet,
                "Tweet has been posted successfully"
            )
        );
});

const getUserTweets = asyncHandler(async (req, res) => {
    if (!isValidObjectId(req?.user?._id)) {
        throw new ApiError(
            400,
            "yoru user id is not valid in order to get all the tweets you made"
        );
    }

    const allTweets = await Tweet.aggregate([
        {
            $match: {
                owner: req?.user?._id || "",
            },
        },
        {
            $lookup : {
                from : "Likes",
                localField : "_id",
                foreignField : "tweet",
                as : "like",
                pipeline : [
                    {
                        $addFields : {
                            tweetLikes : {$cout : "$likes"}
                        },
                        $project : {
                            tweetLikes : 1,
                        }
                    }
                ]
            }
        },
        {
            $set : {
                like : {$first : "$like"}
            },
            $set : {
                likes : "$like.tweetLikes"
            }
        },

        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                tweet: 1,
                owner: 1,
                likes : 1
            },
        },
    ]);

    if (!allTweets?.length > 0) {
        throw new ApiError();
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allTweets,
                "Users All tweet has been fetched successfully"
            )
        );
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { tweet } = req.body;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweet id or no tweet post found");
    }

    if (!tweet) {
        throw new ApiError(
            400,
            "tweet content is required in order to update tweet post"
        );
    }

    const tweetUpdated = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: tweet,
            },
        },
        {
            new: true,
        }
    );

    if (!tweetUpdated) {
        throw new ApiError(
            404,
            "No tweet found in database, must be delete or invalid tweet id"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweetUpdated,
                "tweet has been updated successfully"
            )
        );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId?.trim())) {
        throw new ApiError(404, "Tweet id is not valid");
    }

    const tweetDeleted = await Tweet.findByIdAndDelete(tweetId);

    if (!tweetDeleted) {
        throw new ApiError(
            404,
            "tweet is already deleted, because no such tweet id found in database"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweetDeleted,
                "tweet post has been deleted successfully"
            )
        );
});
export { createTweet, getUserTweets, updateTweet, deleteTweet };
