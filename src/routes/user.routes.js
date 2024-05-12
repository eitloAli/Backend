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
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
router.route("/update-current-password").post(verifyJWT, updateCurrentPassword);

router.route("/update-avatar-image").patch(verifyJWT, upload.single("avatar"), updateAvatarImage)
router.route("/update-cover-image").patch(verifyJWT, upload.single("cover"), updateCoverImage)


router.route("/c/:username").get(verifyJWT, getUserChanneDetails)
router.route("/user-watch-history").post(verifyJWT, getWatchedHistory)


router.route("/test").get(cloud)
router.route("/subscribe").post(verifyJWT, subscribe)

export default router;
