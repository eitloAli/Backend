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
        throw new ApiError(400, "Playlist id or Video id is not valid");
    }

    const video_id = new mongoose.Types.ObjectId(videoId);

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found for adding in playlist");
    } else if (!video.isPublished) {
        throw new ApiError(400, "video is unpublished or private");
    }

    const existingPlaylist = await Playlist.findById(playlistId);

    if (!existingPlaylist) {
        throw new ApiError(
            400,
            "Playlist not found please enter the valid playlist id"
        );
    } else if (existingPlaylist?._id !== req.user._id) {
        throw new ApiError(
            400,
            "you are not authorized to update this playlist"
        );
    } else if (existingPlaylist.videos?.includes(video_id)) {
        throw new ApiError(400, "Video is already in Playlist");
    }

    await existingPlaylist.videos.push(video_id);

    const playlistUpdated = await existingPlaylist.save({
        validateModifiedOnly: true,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistUpdated,
                "Video has been successfully added in playlist"
            )
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Playlist id or Object id is not valid");
    }
    const existingPlaylist = await Playlist.findById(playlistId);

    if (!existingPlaylist) {
        throw new ApiError(404, "Playlist not found");
    } else if (existingPlaylist?.owner !== req?.user?._id) {
        throw new ApiError(
            400,
            "you are not autorized to update this playlist"
        );
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found for adding to playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                vidoes: video._id || " ",
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistId,
                "Video has been removed from the playlist"
            )
        );
});

const getUserPlaylists = asyncHandler(async (req,res) => {
    const {userId} = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "object id is not valid")
    }
    else if (userId !== req?.user?._id.toString()) {
        throw new ApiError(400, "you are not autorize to access this playlist")
    }

    const playlists = await Playlist.aggregate(
        [
            {
                $match : {
                    owner : req?.user?._id
                }
            },
            {
                $lookup : {
                    from : "Video",
                    localField : "videos",
                    foreignField : "_id",
                    as : "video"
                }
            }
        ]
    );

    return res 
            .status(200)
            .json(new ApiResponse(
                200,
                playlists,
                `Playlist fetched successfully for this user ${req?.username}`
            ))
})
export {
    createPlaylist,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getUserPlaylists,
};
