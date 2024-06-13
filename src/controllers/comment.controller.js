import { isValidObjectId } from "mongoose";
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req,res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10, pagination = true} = req.query

    if (isValidObjectId(videoId)) {
        throw new ApiError(404, "Video id is not valid")
    }

    const existedVideo = await Video.findById(videoId)

    if (!existedVideo) {
        throw new ApiError(404, "Video not found for fetching comments")
    }

    const allComment = Comment.aggregate(
        [
            {
                $match : {
                    video : existedVideo?._id
                }
            },
            {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner",
                    pipeline : [
                        {
                            $project : {
                                username : 1,
                                _id : 0
                            }
                        }
                    ]
                }
            },
            {
                $set : {
                    owner : {$first : "$owner"}
                }
            },
            {
                $set : {
                    owner : "$owner.username"
                }
            }
        ]
    )
    
    const option = {
        page,
        limit,
        pagination,
        sort : {
            createdAt : -1
        }
    }

    const paginatedComments = await Comment.aggregatePaginate(allComment, option)

    return res
            .status(200)
            .json(new ApiResponse(
                200,
                {
                    ...paginatedComments,
                    comments : paginatedComments.docs,
                    docs : undefined
                }
            ))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}  = req.params
    const {comment} = req.body
    console.log(req);
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Video id is not valid")
    } 
    else if(!comment) {
        throw new ApiError(400, "Comment text is required")
    } 

    const videoForComment = await Video.findById(videoId)

    if (!videoForComment) {
        throw new ApiError(404, "Video not exist to add comment")
    }


    const newComment = await Comment.create({
        owner : req?.user?._id,
        video : videoForComment?._id,
        comment : comment?.toString(),
    })

    if (!newComment) {
        throw new ApiError(500, "something went wrong while Adding comment")
    }

    return res
            .status(201)
            .json(new ApiResponse(
                200,
                {},
                "Comment has been added successfully"
            ))
})

const updateComment = asyncHandler(async (req,res) => {
    const {commentId} = req.params
    const {comment} = req.body
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is not valid")
    }
    else if (!comment?.toString()){
        throw new ApiError(400, "Comment content is required")
    }

    const commentUpdated = Comment.findByIdAndUpdate(
        commentId,
        {
            $set : {
                comment : comment.toString(), 
            }
        },
        {
            new : true
        }
    )

    if (!commentUpdated) {
        throw new ApiError(404, "Comment not found")
    }

    return res
            .status(200)
            .json(new ApiResponse(
                200,
                commentUpdated,
                "Comment updated Successfully"
            ))
})

const deleteComment = asyncHandler(async (req,res) => {
    const {commentId} = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment id is not valid")
    }

    const commentDeleted = await Comment.findByIdAndDelete(commentId)

    if (!commentDeleted) {
        throw new ApiError(404, "Comment not found for deleting")
    }

    return res
            .status(200)
            .json(new ApiResponse(
                200,
                commentDeleted,
                "Comment has been deleted Successfully"
            ))
})
export { getVideoComments, addComment, updateComment, deleteComment}