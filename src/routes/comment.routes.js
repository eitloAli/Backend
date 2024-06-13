import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const commentRouter = Router()

commentRouter.use(verifyJWT)
commentRouter
        .route("/:videoId")
            .get(getVideoComments)
            .post(addComment)

commentRouter
        .route("/:commentId")
            .patch(updateComment)
            .delete(deleteComment)

export default commentRouter