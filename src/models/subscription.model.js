import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const SubsSchema = new Schema(
    {   
        subscriber : {
            type : Schema.Types.ObjectId,
            ref : "User"
        },
        
        channel : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }
    },
    {
        timestamps : true
    }
)

export const Subscription = mongoose.model("Subscription", SubsSchema) 