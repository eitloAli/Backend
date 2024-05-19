import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
import { ApiError } from './ApiError.js';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return "file path is not available"
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type : "auto"
            }
        )

        return response
        
    } catch (error) {
        console.log("Error in UploadOnCloudinary", error) // remove the locally saved filed as the upload operation got failed
        return null
    }
}

export const deleteCloudinaryImage = async (url) => {
    try {
        const imageUrl = url?.split("/")[7]?.split(".")[0]
        const deletedImage =  await cloudinary.api.delete_resources(
            [imageUrl],
            {
                type : 'upload',
                resource_type : "image"
            }
        )
        deletedImage.imageUrl = imageUrl
        return deletedImage
    } catch (error) {
        throw new ApiError(500, {error}, "something went wrong while deleting the image")
    }

}