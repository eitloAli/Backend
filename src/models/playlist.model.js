import mongoose, {Schema, Document, mongo} from "mongoose"

const playlistSchema = new Schema(
    {
        name : {
            type : String,
            required : [true, "playlist name is required"]
        },
        description : {
            type : String,
            required : [true, "playlist description is required"]
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : [true, "playlist Owner is required"]
        },
        videos : [
            {
                type : Schema.Types.ObjectId,
                ref : "Video",
                required : [true, "Video id is required to add video in playlist"]
            }
        ]
    },
    {
        timestamps : true
    }
)

export const Playlist = mongoose.model("Playlist", playlistSchema)