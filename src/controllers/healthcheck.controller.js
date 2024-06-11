import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import mongoose from "mongoose"

const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
   
    return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "Everything is Ok"
            ))
})

export {
    healthcheck
    }
    