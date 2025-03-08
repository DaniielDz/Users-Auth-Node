import { uploadToCloudinary } from "../utils/cloudinary.js";

export const processGallery = async (req, res, next) => {
    const { gallery } = req.body    

    if (!gallery || !Array.isArray(gallery)) {
        return next()
    }

    try {
        const galleryUrls = await Promise.all(
            req.body.gallery.map(async (base64Image) => {
                const matches = base64Image.match(/^data:(.+);base64,(.+)$/)
                if(!matches) throw new Error("Formato Base64 invlido");
                
                const mimeType = matches[1]
                const buffer = Buffer.from(matches[2], "base64")

                return uploadToCloudinary(buffer, "gallery", mimeType)
            })
        )
        req.body.gallery = galleryUrls
        next()
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}