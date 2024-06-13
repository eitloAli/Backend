import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const likeSchema = new Schema(
    {
        video : {
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        comment : {
            type : Schema.Types.ObjectId,
            ref : "Comment"
        },
        tweet : {
            type : Schema.Types.ObjectId,
            ref : "Comment"
        },
        likedBy : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : [true, "user id is required for like"]
        }
    },
    {
        timestamps :true
    }
)
likeSchema.plugin(mongooseAggregatePaginate)
export const Like = mongoose.model("Like", likeSchema)