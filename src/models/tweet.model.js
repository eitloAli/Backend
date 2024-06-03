import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : [true, "Owner User Id is required"]
        },
        tweet : {
            Type : String,
            required : [true, "tweet content is required"]
        },
    }, 
    {
        timestamps : true
    }
)

export const Tweet = mongoose.model("Tweet", tweetSchema)