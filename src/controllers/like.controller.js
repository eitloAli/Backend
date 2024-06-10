import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video
    const {videoId} = req.params

    if (!videoId?.toString()) {
        throw new ApiError(401, "Video id is required")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is not valid")
    }

    const existingVideoLiked = await Like.findOneAndDelete(
        {
            video : new mongoose.Types.ObjectId(videoId),
            likedBy : req?.user?._id
        }
    )
    if (existingVideoLiked) {
        return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    {},
                    "video has been successfully Unliked"
                ))
    }

    const videoForLike = await Video.findById(videoId)

    if (!videoForLike) {
        throw new ApiError(404, "No video found for like")
    }
    const newLiked = await Like.create({
        video : videoForLike._id,
        likedBy : req?.user?._id
    })

    if (!newLiked) {
        throw new ApiError(500, "something went wrong while liking this video")
    }

    return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                `video has been liked by ${req?.user?.username}`
            ))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment

    const {commentId} = req.params

    if (!commentId?.toString()) {
        throw new ApiError(401, "Comment id is required")
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "comment id is not valid")
    }

    const existingCommentLiked = await Like.findOneAndDelete(
        {
            comment : new mongoose.Types.ObjectId(commentId),
            likedBy : req?.user?._id
        }
    )
    if (existingCommentLiked) {
        return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    {},
                    `Comment has been Unliked by ${req?.user?.username}`
                ))
    }
    
    const commentForLike = await Comment.findById(commentId)

    if (!commentForLike) {
        throw new ApiError(404, "No Comment found for like")
    }
    const newLiked = await Like.create({
        comment : commentForLike._id,
        likedBy : req?.user?._id
    })

    if (!newLiked) {
        throw new ApiError(500, "something went wrong while liking this Comment")
    }

    return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                `Comment has been liked by ${req?.user?.username}`
            ))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    // TODO: toggle like on tweet
    const {tweetId} = req.params
    if (!tweetId?.toString()) {
        throw new ApiError(401, "Tweet id is required")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet id is not valid")
    }

    const existingTweetLiked = await Like.findOneAndDelete(
        {
            tweet : new mongoose.Types.ObjectId(tweetId),
            likedBy : req?.user?._id
        }
    )
    if (existingTweetLiked) {
        return res
                .status(200)
                .json(new ApiResponse(
                    200,
                    {},
                    `Tweet has been Unliked by ${req?.user?.username}`
                ))
    }
    
    const tweetForLike = await Tweet.findById(tweetId)

    if (!tweetForLike) {
        throw new ApiError(404, "No Tweet found for like")
    }
    const newLiked = await Like.create({
        tweet : tweetForLike._id,
        likedBy : req?.user?._id
    })

    if (!newLiked) {
        throw new ApiError(500, "something went wrong while liking this Tweet")
    }

    return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                `Tweet has been liked by ${req?.user?.username}`
            ))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const {page = 1 , limit = 10} = req.query

    const likeVideosPromise = Like.aggregate([
        {
            $match : {
                likedBy : req?.user?._id,
                video : {$exists : true}
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "PlaylistVideo",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "videoOwner",
                            pipeline : [
                                {
                                    $project : {
                                        username : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $set : {
                            videoOwner : {$first : "$videoOwner"}
                        },
                    },
                    {
                        $set : {
                            videoOwner : "$videoOwner.username"
                        }
                    },
                    {
                        $project : {
                            updatedAt : 0,
                            __v :  0,
                            isPublished : 0,
                            description : 0,
                            videoFile : 0,
                            owner : 0,
                        }
                    }
                ]
            }
        },
        {
            $project : {
                video : 0,
                likedBy : 0,
                __v : 0,
                updatedAt :  0,
                _id : 0
            }
        }
    ])

    const paginateOption = {
         page,
         limit,
         sort : {
            createdAt : -1
         }
    }
    const allLikedVideos = await Like.aggregatePaginate(
        likeVideosPromise,
        paginateOption
    )
    
    return res
            .status(200)
            .json(new ApiResponse(
                200,
                allLikedVideos,
                "All videos has been fetched successfully"
            ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}