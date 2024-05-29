import mongoose, { Mongoose, isValidObjectId } from "mongoose";
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
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = -1,
        sortType,
        userId,
    } = req.query;

    if (!query) {
        throw new ApiError(
            400,
            "search query is required in order to perform searching videos"
        );
    }
    const paginateOption = {
        page,
        limit,
    };
    const video = await Video.aggregate([
        {
            $search: {
                index: "title",
                text: {
                    query: `${query}`,
                    path: "title",
                },
            },
        },

        {
            $match: {
                isPublished: true,
            },
        },

        {
            $sort: {
                createdAt: Number(sortBy),
            },
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                        },
                    },
                ],
            },
        },

        {
            $addFields: {
                owner: {
                    $first: "$owner",
                },
            },
        },
    ]);
    const allVideo = await Video.aggregatePaginate(video, paginateOption);

    if (!allVideo) {
        throw new ApiError(404, "No video found based on your query");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allVideo,
                "all video has been fetched successfully"
            )
        );
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
        deleteFiles();
        throw new ApiError(400, "Title is required");
    }

    if (!req?.files?.videoFile) {
        deleteFiles();
        throw new ApiError(400, "Video is required");
    }

    if (!isValidObjectId(req?.user._id)) {
        deleteFiles();
        throw new ApiError(400, "you are not authorized to upload this video");
    }

    const uploadedVideo = await uploadOnCloudinary(req.files.videoFile[0].path);

    if (uploadedVideo === "file path is not available") {
        deleteFiles();
        throw new ApiError(
            500,
            "somethin went wrong while uploading video",
            uploadedVideo
        );
    }
    const uploadedThumbnail = await uploadOnCloudinary(
        req?.files?.thumbnail?.[0]?.path || ""
    );

    deleteFiles();

    const video = await Video.create({
        videoFile: "testing",
        thumbnail: "testing",
        title: title || " ",
        description: description || " ",
        duration: uploadedVideo?.duration.toFixed(2) || 0,
        owner: req.user._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video has been published successfully")
        );
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    console.log(videoId);
    const validObjectId = isValidObjectId(videoId);

    if (!validObjectId || !videoId) {
        throw new ApiError(404, "Video not found");
    }

    const video = await Video.aggregate([
        {
            $match: {_id : new mongoose.Types.ObjectId(videoId)},
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
                            username : 1
                        }
                    }
                ]
            }
        },
        {
            $set : {
                owner : {$first : "$owner"}
            },
        },
        {
            $set : {
                owner : "$owner.username"
            }
        },
        {
            $project : {
                videoFile : 1,
                thumbnail : 1,
                title : 1,
                description : 1,
                duration : 1,
                views : 1,
                owner : 1,
                createdAt : 1
            }
        }

    ]);
    if (video?.length > 0) {
        throw new ApiError(404, "No video Found in database");
    }

    res.status(200).json(
        new ApiResponse(200, video[0], "Video successfully fetched")
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    function deleteFiles() {
        try {
            fs.unlinkSync(req?.files?.thumbnail || "");
        } catch {}
    }

    if (!title?.trim() || !description?.trim()) {
        deleteFiles();
        throw new ApiError(401, "Title and description is required");
    }

    const isVideoIdValid = isValidObjectId(videoId?.trim());

    if (!isVideoIdValid) {
        deleteFiles();
        throw new ApiError(404, "Video id is not valid");
    }

    const existedVideo = await Video.findById(videoId);

    if (!existedVideo) {
        deleteFiles();
        throw new ApiError(404, "No Video found in database");
    }

    const thumbnail = await uploadOnCloudinary(req?.file?.thumbnail || "");

    await deleteCloudinaryImage(existedVideo?.thumbnail || "");

    deleteFiles();

    const updatedUserVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description: description || existedVideo.description,
                thumbnail: thumbnail?.url || "",
            },
        },
        { new: true }
    );

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
    const test = await Video.aggregate([
        {
            $match: {
              owner : new mongoose.Types.ObjectId('66312ac70c286f86402d3f0d')
            }
        },
        {
            $sort : {createdAt : -1}
        }
    ])
    if (!test?.length > 0) {
        throw new ApiError(400, "something went wrong")
    }
    res.json(test)
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
