import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";
const tweetRouter = Router()

tweetRouter.route(verifyJWT)
tweetRouter.route("/").post(createTweet)
tweetRouter.route("/user/:userId").get(getUserTweets)
Router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)
export default tweetRouter