import {v2 as cloudinary} from 'cloudinary';    
import fs from 'fs';    

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,    
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        // upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto', // Automatically detect the resource type (image, video, etc.)
        });
        // file has been uploaded successfully on cloudinary
        fs.unlinkSync(localFilePath); // remove the local file after upload
        return response.url; 

    }catch(err){
        console.error("Upload again", err);
        // remove the lcoaly saved file as the upload failed 
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary as cloudinaryUpload}; // export the function to use in other files