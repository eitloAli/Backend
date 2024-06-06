import { Router } from 'express';
import {
    toggleSubscription,
    subscriberListOfChannel,
    subscribedChannelListOfUser,
    test
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(subscribedChannelListOfUser)
    .post(toggleSubscription)

router.route("/u/:subscriberId").get(subscriberListOfChannel);

export default router
