import {v2 as cloudinary} from 'cloudinary';
import fs from 'nodefs'
          
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

        console.log("file has been uploaded on cloudinary", response.url)
        if (response) {
            fs.unlinkSync(localFilePath)
        }
        
        
        return response
    } catch (error) {
        console.log("Error in UploadOnCloudinary")
        fs.unlinkSync(localFilePath) // remove the locally saved filed as the upload operation got failed
        return null
    }
}