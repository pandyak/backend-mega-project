import mongoose from 'mongoose';
import mongooseAggregatepaginate from "mongoose-aggregate-paginate-v2";

const videoSchema=new Schema({
    videoFile:{
        type:String,//cloudniary url 
        required:true,
        
        
    },

    thumbnail:{
         type:String,//cloudniary url 
        required:true,
        
    },

    title:{
         type:String,
        required:true,
        
    },

    description:{
         type:String,
        required:true,
        
    },

    duration:{
        type:Number,
        required:true,//cloudniary url

    },

    views:{
        type:Number,
        default:0,
        
    },

    isPublished:{
        type:Boolean,
        default:true,
    },

    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",

    }



},
{
    timeStamps:true
})

videoSchema.plugin(mongooseAggregatepaginate);

export const Video=mongoose.model("video",videoSchema)