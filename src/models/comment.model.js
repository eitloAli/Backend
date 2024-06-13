import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : [true, "owner id is required for add a comment"]
        },
        comment : {
            type : String,
            required : [true, "Comment is required"]
        },
        video : {
            type : Schema.Types.ObjectId,
            ref : "Video",
            required : [true, "video id is required for adding comment"]
        }
    },
    {
        timestamps : true 
    }
);
commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("Comment", commentSchema)