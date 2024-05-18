import mongoose,{isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { 
uploadOnCloudinary,
deleteCloudinaryImage } from "../utils/cloudinary.js"

import fs from "fs"
import { asyncHandler } from "../utils/asyncHandler.js"

const getAllvideos = asyncHandler( async (req,res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
})

const publishVideo = asyncHandler( async (req,res) => {
    const {title, description} =  req.body
    if (!title) {
        fs.unlinkSync(req?.files?.video[0]?.path ?? "")
        fs.unlinkSync(req?.files?.thumbnail[0]?.path ?? "")
        throw new ApiError(400, "Title is required")
    }

    if(req?.files?.video){
        fs.unlinkSync(req?.files?.thumbnail[0]?.path ?? "")
        throw new ApiError(400, "Video is required")
    }

    const validOwner = isValidObjectId(req?.user._id)

    if (!validOwner) {
        throw new ApiError(400, "you are not authorized to upload this video")
    }

    const uploadedVideo = await uploadOnCloudinary(req.files.video[0].path)
    const uploadedThumbnail = await uploadOnCloudinary(req.files.video[0].path)
    
    fs.unlinkSync(req?.files?.thumbnail[0]?.path ?? "")
    fs.unlinkSync(req?.files?.video[0]?.path ?? "")
    
    console.log(video);
    
    const video = await Video.create(
        {
            videoFile : uploadedVideo?.url || "URL not found",
            thumbnail : uploadedThumbnail?.url || "URL not found",
            title,
            description,
            duration : uploadedVideo?.duration || 404,
            owner : req.user._id

        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video has been published successfully"
        )
    )
})
export {
    publishVideo
}
 