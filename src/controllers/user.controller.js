import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
    deleteCloudinaryImage,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Subscription } from "../models/subscription.model.js";
const generateAccessAndRefresh = async (user) => {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "something went wrong while generation Tokens");
    }
};

// written by ali
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exits: username, email
    // check image for images, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creating
    // return user response
    const { fullName, email, password, username } = req.body;
    console.log(req.body);
    function deleteTempImg() {
        try {
            fs.unlinkSync(req.files.avatar[0].path ?? "");
        } catch {}
        try {
            fs.unlinkSync(req.files.coverImage[0].path ?? "");
        } catch {}
    }
    if (
        [fullName, email, password, username].some(
            (field) => (field?.trim() || "") === ""
        )
    ) {
        deleteTempImg();
        throw new ApiError(400, "All fields are required");
    }
    // below code could be used
    // if (!fullName) {
    //     deleteTempImg()
    //     throw new ApiError(400, "FullName is required");
    // } else if (!email) {
    //     deleteTempImg()
    //     throw new ApiError(400, "Email is required");
    // } else if (!password) {
    //     deleteTempImg()
    //     throw new ApiError(400, "Password is required");
    // } else if (!username) {
    //     deleteTempImg()
    //     throw new ApiError(400, "username is required");
    // }
    // const existedUser = await User.findOne({
    //     $or: [{ username }, { email }],
    // });
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (existedUser) {
        deleteTempImg();
        throw new ApiError(400, "User or email is already exist");
    }
    let avatarLocalImage;
    try {
        avatarLocalImage = req.files.avatar[0].path;
    } catch {
        avatarLocalImage = "";
    }
    if (!avatarLocalImage) {
        deleteTempImg();
        throw new ApiError(400, "Avatar Image is required");
    }

    let coverImageLocalPath;
    try {
        coverImageLocalPath = req.files.coverImage[0].path;
    } catch {
        coverImageLocalPath = "";
    }

    const avatar = await uploadOnCloudinary(avatarLocalImage);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    deleteTempImg();

    if (!avatar) {
        throw new ApiError(400, "avatar image is required");
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage.url ?? "",
    });

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!userCreated) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }
    console.log(
        new ApiResponse(200, userCreated, "User Registered Succesfully")
    );

    return res
        .status(201)
        .json(new ApiResponse(200, userCreated, "User Registered Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    // if([email, username, password].some(field => field.trim() === "")){
    //     throw new ApiError(400, "Login Credentials are Required it can't be empty")
    // } good practice but use the below method
    if (!email && !username) {
        throw new ApiError(400, "email or username is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) {
        throw new ApiError(400, "user is not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Password is Incorrect");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefresh(user);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, { user }, "User logout Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(400, "Unauthorized Request");
    }

    const decoded = jwt.verify(
        incomingRefreshToken,
        process.env.REFERESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded._id);

    if (!user) {
        throw new ApiError(400, "Invalid token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh Token is invalid or expired");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefresh(user);

    const options = {
        httpOnly: true,
        secure: true,
    };

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken },
                "Access Token refresh successfully"
            )
        );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName && !email) {
        throw new ApiError(400, "All field are required");
    }
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(400, "User does not exist");
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, {
        $set: {
            fullName: fullName,
            email: email,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "FullName and email has been updated"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(200, req.user, "Current user Fetched Successfully")
    );
});

const updateCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current and new password is required");
    } else if (currentPassword === newPassword) {
        throw new ApiError(
            401,
            "new password must be different from current password"
        );
    }

    const user = await User.findById(req?.user?._id);

    if (!user) {
        throw new ApiError(400, "Something went wrong while finding your user");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "your old password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateModifiedOnly : true});

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "password has been changed successfully"
            )
        );
});

const updateAvatarImage = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        throw new ApiError(400, "Avatar image is required");
    }

    const uploadedAvatar = await uploadOnCloudinary(req.file?.path);
    await deleteCloudinaryImage(req?.user?.avatar || " ");

    const userUpdated = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: uploadedAvatar.url,
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userUpdated,
                "avatar image successfully uploaded"
            )
        );
});

const updateCoverImage = asyncHandler(async (req, res) => {
    if (!req.file?.path) {
        throw new ApiError(400, "Cover image is required");
    }

    const uploadedCoverImage = await uploadOnCloudinary(req?.file?.path);
    await deleteCloudinaryImage(req?.user?.coverImage || " ");

    const userUpdated = await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                coverImage: uploadedCoverImage?.url || "Url not found",
            },
        },
        {
            new: true,
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userUpdated,
                "Cover image successfully updated"
            )
        );
});

const getUserChanneDetails = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "no user found");
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            subscriber: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribeTo",
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
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedChannelsCount: {
                    $size: "$subscribeTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                watchedHistory: 0,
                password: 0,
                updatedAt: 0,
                __v: 0,
                refreshToken: 0,
                subscribers: 0,
                subscribeTo: 0,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist");
    }
    console.log(channel);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "channel details fetched successfully"
            )
        );
});

const getWatchedHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user._id,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchedHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
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
                        $set: {
                            owner: { $first: "$owner" },
                        },
                    },
                    {
                        $set: {
                            owner: "$owner.username",
                        },
                    },
                    {
                        $project: {
                            updatedAt: 0,
                            description: 0,
                            isPublished: 0,
                            videoFile: 0,
                            __v: 0,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                _id: 0,
                watchHistory: 1,
            },
        },
    ]);
    res.status(200).json(
        new ApiResponse(
            200,
            user[0],
            "User watched history fetched successfully"
        )
    );
});

// testing to sunscribe a user
const subscribe = asyncHandler(async (req, res) => {
    const sub = await Subscription.create({
        subscriber: req.user._id,
        channel: req.user._id,
    });
    return res.json(sub);
});

const cloud = asyncHandler(async (req, res) => {
    const URL =
        "https://res.cloudinary.com/eitlo-ali/image/upload/v1714494365/eopaibq8seziyiglubna.avif";
    const deletedImage = await deleteCloudinaryImage(URL);
    const { imageUrl } = deletedImage;
    console.log(imageUrl);

    if (deletedImage.deleted[imageUrl] === "not_found") {
        throw new ApiError(500, "image not found");
    }
    return res.json(deletedImage);
}); // testing

const test = asyncHandler(async (req, res) => {
    console.log(req.body);
});
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateAccountDetails,
    getCurrentUser,
    updateCurrentPassword,
    updateAvatarImage,
    updateCoverImage,
    getUserChanneDetails,
    getWatchedHistory,
    subscribe,
    cloud,
    test,
};
