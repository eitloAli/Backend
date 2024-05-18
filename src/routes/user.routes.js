import { Router } from "express";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateCurrentPassword,
  updateAccountDetails,
  cloud,
  updateAvatarImage,
  updateCoverImage,
  getUserChanneDetails,
  subscribe,
  getWatchedHistory,
  test,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter  = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);
userRouter.route("/refresh-access-token").post(refreshAccessToken);

// secure routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
userRouter.route("/update-current-password").post(verifyJWT, updateCurrentPassword);

userRouter.route("/update-avatar-image").patch(verifyJWT, upload.single("avatar"), updateAvatarImage)
userRouter.route("/update-cover-image").patch(verifyJWT, upload.single("cover"), updateCoverImage)


userRouter.route("/c/:username").get(verifyJWT, getUserChanneDetails)
userRouter.route("/user-watch-history").post(verifyJWT, getWatchedHistory)


userRouter.route("/subscribe").post(verifyJWT, subscribe)
userRouter.route("/test").post(test)

export default userRouter;
