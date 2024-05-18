import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllvideos, publishAVideo, updateVideo,  } from "../controllers/video.controller.js"
const videoRouter = Router()
videoRouter.use(verifyJWT)

videoRouter.route("/")
    .get()
    .post(
        upload.fields(
            [
                {
                    name : "videoFile",
                    maxCount : 1
                },
                {
                    name : "thumbnail",
                    maxCount : 1
                }
            ]
        ),
        publishAVideo
    );

videoRouter
    .route("/:videoId")
    .get( getAllvideos )
    .delete( deleteVideo )
    .patch(upload.single("thumbnail"), updateVideo)

export default videoRouter