import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken"
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

  if (
    [fullName, email, password, username].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, " All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    try {
      fs.unlinkSync(req.files.avatar[0].path);
      fs.unlinkSync(req.files.coverImage[0].path ?? "");
    } catch (error) {}

    throw new ApiError(400, "User or email is already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

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
    throw new ApiError(500, "Something went wrong while registering the user");
  }
  console.log(new ApiResponse(200, userCreated, "User Registered Succesfully"));

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
  await User.findByIdAndUpdate(
    req.user_id,
    {
      $set: {
        refreshToken: undefined,
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
    .json(new ApiResponse(200, {}, "USer logged in Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized Request")
  }

  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFERESH_TOKEN_SECRET
  )

  const user = await User.findById(decoded._id)

  if (!user) {
    throw new ApiError(400, "Invalid token")
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token is invalid or expired")
  }

  const {accessToken, refreshToken} = await generateAccessAndRefresh(user)
  
  const options = {
    httpOnly : true,
    secure : true
  }

  res.status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(200, {accessToken, refreshToken}, "Access Token refresh successfully")
  )
  
})

const updateUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

});

const getCurrentUser = asyncHandler()

export { 
  registerUser,
  loginUser,
  logoutUser,
  updateUserDetails,
  refreshAccessToken
};
