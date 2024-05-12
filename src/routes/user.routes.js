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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
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

router.route("/login").post(loginUser);
router.route("/refresh-access-token").post(refreshAccessToken);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-user-details").post(verifyJWT, updateAccountDetails);
router.route("/update-current-password").post(verifyJWT, updateCurrentPassword);
router.route("/test").get(cloud)
router.route("/update-avatar-image").post(verifyJWT, upload.single("avatar"), updateAvatarImage)
router.route("/update-cover-image").post(verifyJWT, upload.single("cover"), updateCoverImage)
router.route("/c/:username").post(verifyJWT, getUserChanneDetails)
router.route("/subscribe").post(verifyJWT, subscribe)
router.route("/user-watch-history").post(verifyJWT, getWatchedHistory)
export default router;
