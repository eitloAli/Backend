import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
    uploadOnCloudinary,
    deleteCloudinaryImage,
} from "../utils/cloudinary.js";

import fs from "fs";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllvideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

const publishAVideo = asyncHandler(async (req, res) => {
    function deleteFiles() {
        try {
            fs.unlinkSync(req.files.videoFile[0].path ?? "");
        } catch {}
        try {
            fs.unlinkSync(req.files.thumbnail[0].path ?? "");
        } catch {}
    }

    const { title, description } = req.body;

    if (!title) {
        deleteFiles()
        throw new ApiError(400, "Title is required");
    }

    if (!req?.files?.videoFile) {
        deleteFiles()
        throw new ApiError(400, "Video is required");
    }

    const validOwner = isValidObjectId(req?.user._id);
    if (!validOwner) {
        deleteFiles()
        throw new ApiError(400, "you are not authorized to upload this video");
    }

    const uploadedVideo = await uploadOnCloudinary(req.files.videoFile[0].path);
    const uploadedThumbnail = await uploadOnCloudinary(
        req.files.thumbnail[0].path
    );
    
    console.log(uploadedVideo);

    deleteFiles()

    const video = await Video.create({
        videoFile: uploadedVideo?.url || "URL not found",
        thumbnail: uploadedThumbnail?.url || "URL not found",
        title,
        description,
        duration: uploadedVideo?.duration.toFixed(2) || 0,
        owner: req.user._id,
    });

    console.log(video);
    console.log(55);
    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video has been published successfully")
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const validObjectId = isValidObjectId(videoId);

    if (!validObjectId || videoId) {
        throw new ApiError(404, "Video not found");
    }

    const video = await Video.aggregate([
        {
            $match: new mongoose.Types.ObjectId(videoId),
        },
    ]);

    if (!video) {
        throw new ApiError(404, "No video Found in database");
    }

    res.status(200).json(
        new ApiResponse(200, video, "Video successfully fetched")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!title?.trim() && !description?.trim()) {
        fs.unlinkSync(req?.files?.thumbnail);
        throw new ApiError(401, "Title and description is required");
    }

    const isVideoIdValid = isValidObjectId(videoId?.trim());

    if (!isVideoIdValid) {
        fs.unlinkSync(req?.files?.thumbnail);
        throw new ApiError(404, "Video id is not valid");
    }

    const existedVideo = await Video.findById(videoId);

    if (!existedVideo) {
        fs.unlinkSync(req?.files?.thumbnail);
        throw new ApiError(404, "No Video found in database");
    }

    const thumbnail = await uploadOnCloudinary(req?.file?.thumbnail || "");

    await deleteCloudinaryImage(existedVideo?.thumbnail || "");
    fs.unlinkSync(req?.files?.thumbnail);

    const updatedUserVideo = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title,
            description: description || existedVideo.description,
            thumbnail: thumbnail?.url || "",
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUserVideo, "Video has been updated"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const existedVideo = await Video.findById(videoId);

    if (!existedVideo) {
        throw new ApiError(404, "No video found for deleting");
    }

    if (existedVideo?._id !== req?.user._id) {
        throw new ApiError(400, "you are not authorize to delete this video");
    }

    const videoDeleted = await Video.deleteOne(videoId);

    res.status(200).json(200, videoDeleted, "successfully deleted the video");
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(
            404,
            "No video found for changing the Publish status"
        );
    }

    video.isPublished = !video.isPublished;

    const statusUpdated = await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                statusUpdated,
                "Publish status has been updated"
            )
        );
});

const test = asyncHandler(async (req, res) => {
    const uploadedVideo = await uploadOnCloudinary(req.files.videoFile[0].path);
    console.log(uploadedVideo);
    return res.json(uploadedVideo)
});
export {
    test,
    getAllvideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
