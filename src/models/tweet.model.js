import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : [true, "tweet creator is requried"]
        },
        tweet : {
            Type : String,
            required : [true, "tweet owner is required"]
        },
    },
    {
        timestamps : true
    }
)

export const Tweet = mongoose.model("Tweet", tweetSchema)