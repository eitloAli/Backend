import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getAllvideos, publishAVideo, test, updateVideo,  } from "../controllers/video.controller.js"
const videoRouter = Router()

videoRouter.use(verifyJWT)
videoRouter.route("/")
    .get((req,res) => res.send("everything fine "))
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

videoRouter.route("/:videoId")
        .get( getAllvideos )
        .delete( deleteVideo )
        .patch(upload.single("thumbnail"), updateVideo)

videoRouter.route("/1").post(upload.fields([
{
name : "videoFile",
maxCount: 1
},

        ]), test)        
export default videoRouter