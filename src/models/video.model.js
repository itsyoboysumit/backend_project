import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; 

const videoSchema = new Schemma({
    videoFile:{
        type: String, // URL to the video file
        required: true,
        trim: true  
    },
    thumbnail: {
        type: String, // URL to the thumbnail image
        required: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // Duration in seconds
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    }
},{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model('Video', videoSchema);