import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (buffer, folder = "posts", mimeType) => {
    try {
        const file = `data:${mimeType};base64,${buffer.toString("base64")}`

        const result = await cloudinary.uploader.upload(file, { folder })

        return result.secure_url
    } catch (error) {
        throw new Error("Error al subir la imagen a Cloudinary");
    }
}