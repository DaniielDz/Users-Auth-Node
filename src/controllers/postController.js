import { Post } from "../models/Post.js"

export class PostController {
    static async create(req, res) {
        try {
            const {
                title,
                category,
                firstTxt,
                secondTxt,
                progress,
                version,
                resolution,
                optifine,
                download,
                seconds,
                tags,
                embed,
                gallery
            } = req.body

            const result = await Post.create(
                title,
                category,
                firstTxt,
                secondTxt,
                progress,
                version,
                resolution,
                optifine,
                download,
                seconds,
                tags,
                embed,
                gallery
            )

            if (!result.success) {
                return res.status(400).json({ message: result.message })
            }

            return res.status(201).json({ message: result.message })
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error })
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params

            const result = await Post.getById(id)

            if (!result.success) {
                return res.status(400).json({ message: result.message })
            }

            return res.json({ data: result.data })
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error })
        }
    }
}