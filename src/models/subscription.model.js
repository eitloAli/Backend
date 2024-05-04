import mongoose, {Schema, mongo} from "mongoose";
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

SubsSchema.plugin(mongooseAggregatePaginate)
export const Subscription = mongoose.model("Subscription", SubsSchema) 