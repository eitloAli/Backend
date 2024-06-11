import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"

const getChannelStats = asyncHandler(async (req,res) => {
    const {page = 1, limit = 10} = req.query
    const userStat = await  Video.aggregate(
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
                    as : "channel",
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
                $lookup : {
                    from : "likes",
                    localField : "_id",
                    foreignField : "video",
                    as : "videoLikes"
                }
            },
            {
                $set : {
                    channel : {$first : "$channel"}
                }
            },
            {
                $set : {
                    channel : "$channel.username"
                }
            },
            {
                $project : {
                    videoFile : 0,
                    description : 0,
                    isPublished : 0,
                    __v : 0,
                    updatedAt : 0
                }
            },
            {
                $group: {
                  _id: null,
                  allVideos : {
                    $push : "$$ROOT"
                  },
                  totalViews : {
                    $sum : "$views"
                  },
                  totalLikes : {$sum : "$videoLikes"},
                  ownerId : {$first : "$owner"}
                }
            },

            {
                $set : {
                    totalVideoCount : {$size : "$allVideos"}
                }
            },
            {
                $project : {
                    _id : 0,
                }
            },

            // {
            //     $lookup : {
            //         from : "likes",
            //         localField : "",
            //         foreignField : "_id",
            //         as : "ali"
            //     }
            // }
        ]
    )
    return res.json(userStat[0])
})
export {getChannelStats}