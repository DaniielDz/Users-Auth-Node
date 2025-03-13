import { uploadToCloudinary } from "../utils/cloudinary.js";

export const processGallery = async (req, res, next) => {
    const { gallery } = req.body    

    if (!gallery || !Array.isArray(gallery)) {
        return next()
    }

    try {
        const galleryUrls = await Promise.all(
            req.body.gallery.map(async (image) => {
            const matches = image.match(/^data:(.+);base64,(.+)$/)
            if (matches) {
                const mimeType = matches[1]
                const buffer = Buffer.from(matches[2], "base64")
                return uploadToCloudinary(buffer, "gallery", mimeType)
            } else {
                return image
            }
            })
        )
        req.body.gallery = galleryUrls        
        next()
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}