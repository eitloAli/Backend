import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const SubsSchema = new Schema(
    {   
        subscriber : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : [true, "subscriber id is required for subscribing a channel"]
        },
        
        channel : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : [true, "Channel id is required for subscribing a channel"]
        }
    },
    {
        timestamps : true
    }
)

export const Subscription = mongoose.model("Subscription", SubsSchema) 