import multer from 'multer' 
import {CloudinaryStorage} from 'multer-storage-cloudinary'
import cloudinary from './cloudinary.js'



const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'IE213',
        allowed_formats: ['jpg', 'png', 'jpeg','webp']
    }
})

const parser = multer({ storage: storage }); //cấu hình tải ảnh lên Cloudinary
export default parser