import { User } from "../models/user.model.js";
// import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
// import { Subscription } from "../models/subscription.model.js";
// import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // I try to get all the data in one aggregation pipeline it's bit complicated
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

    //channelStatsResult object will remove later
    const channelStatsResult = {
        /*
{
    "statusCode": 200,
    "data": {
        "allVideos": [
            {
                "_id": "664caf2a1f6aba5d6af08073",
                "thumbnail": "",
                "title": "how are you",
                "duration": 11.29,
                "views": 200,
                "createdAt": "2024-05-21T14:26:50.113Z",
                "channel": "eitlo"
            },
            {
                "_id": "664e24a9e6f065dccea175b3",
                "thumbnail": "testing",
                "title": "how are you guys",
                "duration": 11.29,
                "views": 2000,
                "createdAt": "2024-05-22T17:00:25.358Z",
                "channel": "eitlo"
            },
            {
                "_id": "664e24cbe6f065dccea175b6",
                "thumbnail": "testing",
                "title": "how your family doing",
                "duration": 11.29,
                "views": 0,
                "createdAt": "2024-05-22T17:00:59.204Z",
                "channel": "eitlo"
            },
            {
                "_id": "664e269ee6f065dccea175b9",
                "thumbnail": "testing",
                "title": "how you end up here",
                "duration": 11.29,
                "views": 345,
                "createdAt": "2024-05-22T17:08:46.939Z",
                "channel": "eitlo"
            }
        ],
        "totalViews": 2545,
        "totalLikes": 2,
        "ownerId": "66312ac70c286f86402d3f0d",
        "totalVideoCount": 4,
        "totalSubscriber": 1
    },
    "messege": "channel stats fetched successfully",
    "success": true
}
*/
    }
    return res
            .status(200)
            .json(new ApiResponse(
                200,
                channelStats[0],
                "channel stats fetched successfully"
            ))
});

const getChannelVideos = asyncHandler(async (req,res) => {
    const {page = 1, limit = 10, pagination = false} = req.query

    const option = {
        page,
        limit,
        sort : {
            createdAt : -1
        },
        pagination
    }

    const videos =  Video.aggregate(
        [
            {
                $match : {
                    owner : req?.user?._id
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
            },
            {
                $project : {
                    videoFile : 0,
                    description : 0,
                    isPublished : 0,
                    updatedAt : 0,
                    __v : 0
                }
            }
        ]
    )

    const paginatedVideos = await Video.aggregatePaginate(videos,option )

    // paginatedVideosResult will remove later
    const paginatedVideosResult = {
        /*{
    "statusCode": 200,
    "data": {
        "totalDocs": 4,
        "limit": 4,
        "page": 1,
        "totalPages": 1,
        "pagingCounter": 1,
        "hasPrevPage": false,
        "hasNextPage": false,
        "prevPage": null,
        "nextPage": null,
        "videos": [
            {
                "_id": "664e269ee6f065dccea175b9",
                "thumbnail": "testing",
                "title": "how you end up here",
                "duration": 11.29,
                "views": 345,
                "owner": "eitlo",
                "createdAt": "2024-05-22T17:08:46.939Z"
            },
            {
                "_id": "664e24cbe6f065dccea175b6",
                "thumbnail": "testing",
                "title": "how your family doing",
                "duration": 11.29,
                "views": 0,
                "owner": "eitlo",
                "createdAt": "2024-05-22T17:00:59.204Z"
            },
            {
                "_id": "664e24a9e6f065dccea175b3",
                "thumbnail": "testing",
                "title": "how are you guys",
                "duration": 11.29,
                "views": 2000,
                "owner": "eitlo",
                "createdAt": "2024-05-22T17:00:25.358Z"
            },
            {
                "_id": "664caf2a1f6aba5d6af08073",
                "thumbnail": "",
                "title": "how are you",
                "duration": 11.29,
                "views": 200,
                "owner": "eitlo",
                "createdAt": "2024-05-21T14:26:50.113Z"
            }
        ]
    },
    "messege": "All videos has been fetched successfully",
    "success": true
}*/
    }
    return res
            .status(200)
            .json(new ApiResponse(
                200,
                {
                    ...paginatedVideos,
                    videos : paginatedVideos.docs, 
                    docs: undefined
                },
                "All videos has been fetched successfully"
            ))
})
export { getChannelStats, getChannelVideos };