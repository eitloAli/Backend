import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }

    const newPlaylist = await Playlist.create({
        name,
        description: description || " ",
        owner: req?.user?._id,
    });

    if (!newPlaylist) {
        throw new ApiError(
            500,
            "something went wrong while creating this playlist"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newPlaylist,
                "New playlist has been created Successfully"
            )
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(
            400,
            "Playlist id is not valid please enter a valid playlist Id"
        );
    }

    const existedPlaylist = await Playlist.findById(playlistId);

    if (!existedPlaylist) {
        throw new ApiError(404, `No playlist found with this id ${playlistId}`);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                existedPlaylist,
                "playlist has been fetched successfully by id"
            )
        );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlist id is not valid");
    }

    const { name, description } = req.body;
    if (!name?.length > 0 || !description?.length > 0) {
        throw new ApiError(400, "playlist name and description is required");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedPlaylist) {
        throw new ApiError(
            404,
            `playlist not found with this id ${playlistId}`
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "playlist has been updated"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Playlist id is not valid");
    }

    const playlistDeleted = await Playlist.findByIdAndDelete(playlistId);

    if (!playlistDeleted) {
        throw new ApiError(
            400,
            `Playlist not found with this id ${playlistId}`
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist has been deleted"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(video)) {
        throw new ApiError(400, "Playlist id or Video id is not valid")
    }

    const video_id = new mongoose.Types.ObjectId(videoId)

    const video = await Video.findById(videoId);
    
    if (!video) {
        throw new ApiError(404, "Video not found for adding in playlist")
    }


    const playlist = await Playlist.findByIdAndUpdate(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found please enter the valid playlist id")
    }


    if (playlist?._id !== req.user._id) {
        throw new ApiError(400, "you are not authorized to update this playlist")   
    }


    if (playlist.videos?.includes(video_id)) {
        throw new ApiError(400, "Video is already in Playlist")
    }

    playlist.videos.push(video_id)

    const playlistUpdated = await playlist.save({validateBeforeSave : true})
    
    
    return res
            .status(200)
            .json(new ApiResponse(
                200,
                playlistUpdated,
                "Video has been successfully added in playlist"
            ))
});
export {
    createPlaylist,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
};
