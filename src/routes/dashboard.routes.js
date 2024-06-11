import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {getChannelStats} from "../controllers/dashboard.controller.js"
const dashboardRouter = Router()

dashboardRouter.use(verifyJWT)

dashboardRouter.route("/stats").get(getChannelStats)
dashboardRouter.route("/videos").get()
export default dashboardRouter