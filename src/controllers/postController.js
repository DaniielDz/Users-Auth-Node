import { Post } from "../models/Post.js"

export class PostController {
    static async create(req, res) {
        try {
            const { postType, formData, gallery } = req.body

            let result;

            if (postType === "resourcepacks") {
                const {
                    title,
                    path,
                    firstTxt,
                    secondTxt,
                    progress,
                    version,
                    resolution,
                    dwnFileLink,
                    seconds,
                    optifine,
                    embed,
                    tags,
                } = formData

                result = await Post.createRP(
                    title,
                    path,
                    firstTxt,
                    secondTxt,
                    progress,
                    version,
                    resolution,
                    dwnFileLink,
                    seconds,
                    optifine,
                    embed,
                    tags,
                    gallery
                )
            } else {
                const {
                    title,
                    path,
                    text,
                    embed,
                    tags
                } = formData

                result = await Post.createPF(
                    title,
                    path,
                    text,
                    embed,
                    tags,
                    gallery
                )
            }

            if (!result.success) {
                return res.status(400).json({ message: result.message })
            }

            return res.status(201).json({ message: result.message })
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error })
        }
    }

    static async getAll(req, res) {
        try {
            const page = parseInt(req.query.page) || 1; // Página actual (default 1)
            const limit = parseInt(req.query.limit) || 10; // Items por página (default 10)
            const path = req.query.path; // Filtro por path (opcional)
            const type = req.query.type; // Tipo de post: 'respacks' o 'portfolio'

            let result;

            // Determinar qué método llamar según el tipo de post
            if (type === 'respacks') {
                result = await Post.getAllResPacks(page, limit, path);
            } else if (type === 'portfolio') {
                result = await Post.getAllPortfolio(page, limit, path);
            } else {
                return res.status(400).json({
                    message: "Tipo de post no válido. Use 'respacks' o 'portfolio'.",
                    data: []
                });
            }

            // Si no se encontraron posts
            if (!result.success) {
                return res.status(404).json({
                    message: result.message,
                    data: result.data
                });
            }

            // Devolver los posts encontrados
            return res.json({
                message: result.message,
                currentPage: page,
                totalPages: result.totalPages,
                totalPosts: result.totalPosts,
                data: result.data
            });
        } catch (error) {
            console.error("Error en el servidor:", error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params
            const { type } = req.query

            const result = await Post.getById(id, type)


            if (!result.success) {
                return res.status(400).json({ message: result.message })
            }

            return res.json({ data: result.data })
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error })
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params; // ID y tipo del post a actualizar
            const { type } = req.query; // ID y tipo del post a actualizar
            const {
                updatedFields,
                newTags,
                gallery // Array de imágenes nuevas
            } = req.body;            

            const result = await Post.update(id, type, updatedFields, gallery, newTags);

            if (!result.success) {
                return res.status(400).json({ message: result.message });
            }

            return res.status(200).json({ message: result.message });
        } catch (error) {
            console.error("Error en el servidor:", error);
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }


    static async delete(req, res) {
        try {
            const { id } = req.params;
            const { type } = req.query

            const result = await Post.delete(id, type);

            if (!result.success) {
                return res.status(400).json({ success: result.success, message: result.message });
            }

            return res.status(200).json({ success: result.success, message: result.message });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor', error });
        }
    }
}