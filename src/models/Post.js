import { pool } from "../config/db.js";

export class Post {
    static async createRP(
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
    ) {
        let connection;

        try {
            connection = await pool.getConnection();

            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO ResPacksPosts (
                    title, path, firstTxt, secondTxt, progress, version, resolution, dwnFileLink, seconds, optifine, embed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [title, path, firstTxt, secondTxt, progress, version, resolution, dwnFileLink, seconds, optifine, embed]
            )


            const postID = result.insertId;

            if (gallery && gallery.length > 0) {
                for (let i = 0; i < gallery.length; i++) {
                    await connection.execute(
                        `INSERT INTO PostImages (post_type, respacks_post_id, portfolio_post_id, image_url, image_order)
                         VALUES (?, ?, ?, ?, ?)`,
                        ["ResPacks", postID, null, gallery[i], i + 1]
                    );
                }
            }

            if (tags && tags.length > 0) {
                for (const tag of tags) {
                    await connection.execute(
                        `INSERT IGNORE INTO tags (name) VALUES (?)`,
                        [tag]
                    );

                    const [tagResult] = await connection.execute(
                        `SELECT id FROM tags WHERE name = ?`,
                        [tag]
                    );
                    const tagID = tagResult[0].id;

                    await connection.execute(
                        `INSERT INTO ResPacksPost_tags (post_id, tag_id) VALUES (?, ?)`,
                        [postID, tagID]
                    );

                }
            }

            await connection.commit();

            return { success: true, message: "Post creado con éxito." };
        } catch (error) {
            // Revertir la transacción en caso de error
            if (connection) await connection.rollback();
            return { success: false, message: "Fallo al crear el post." };
        } finally {
            // Liberar la conexión
            if (connection) connection.release();
        }
    }

    static async createPF(
        title,
        path,
        text,
        embed,
        tags,
        gallery
    ) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO PortfolioPosts (
                    title, path, text, embed
                ) VALUES (?, ?, ?, ?)`,
                [title, path, text, embed]
            );

            const postID = result.insertId;

            if (gallery && gallery.length > 0) {
                for (let i = 0; i < gallery.length; i++) {
                    await connection.execute(
                        `INSERT INTO PostImages (post_type, portfolio_post_id, image_url, image_order)
                         VALUES (?, ?, ?, ?)`,
                        ["Portfolio", postID, gallery[i], i + 1]
                    );
                }
            }

            if (tags && tags.length > 0) {
                for (const tag of tags) {
                    await connection.execute(
                        `INSERT IGNORE INTO tags (name) VALUES (?)`,
                        [tag]
                    );

                    const [tagResult] = await connection.execute(
                        `SELECT id FROM tags WHERE name = ?`,
                        [tag]
                    );
                    const tagID = tagResult[0].id;

                    await connection.execute(
                        `INSERT INTO PortfolioPost_tags (post_id, tag_id) VALUES (?, ?)`,
                        [postID, tagID]
                    );
                }
            }

            await connection.commit();
            return { success: true, message: "Post de Portfolio creado con éxito." };
        } catch (error) {
            if (connection) await connection.rollback();
            console.error("Error al crear el post de Portfolio:", error);
            return { success: false, message: "Fallo al crear el post de Portfolio." };
        } finally {
            if (connection) connection.release();
        }
    }

    static async getAllResPacks(page = 1, limit = 10, path = null, title = null) {
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const offset = (pageNumber - 1) * limitNumber;

        // Construir la consulta SQL dinámicamente
        let query = `
            SELECT 
                ResPacksPosts.*, 
                GROUP_CONCAT(PostImages.image_url ORDER BY PostImages.image_order SEPARATOR ',') AS images,
                GROUP_CONCAT(DISTINCT tags.name SEPARATOR ',') AS tags
            FROM ResPacksPosts
            LEFT JOIN PostImages ON ResPacksPosts.id = PostImages.respacks_post_id
            LEFT JOIN ResPacksPost_tags ON ResPacksPosts.id = ResPacksPost_tags.post_id
            LEFT JOIN tags ON ResPacksPost_tags.tag_id = tags.id
        `;

        // Parámetros para la consulta
        const queryParams = [];

        // Agregar filtros dinámicos
        if (path || title) {
            query += ` WHERE `;
            if (path) {
                query += ` ResPacksPosts.path = ? `;
                queryParams.push(path);
            }
            if (title) {
                if (path) query += ` AND `; // Agregar AND si ya hay un filtro de path
                query += ` ResPacksPosts.title LIKE ? `;
                queryParams.push(`%${title}%`); // Búsqueda parcial con LIKE
            }
        }

        query += `
            GROUP BY ResPacksPosts.id
            LIMIT ? OFFSET ?
        `;

        // Agregar límite y offset a los parámetros
        queryParams.push(limitNumber, offset);

        // Ejecutar la consulta para obtener los posts
        const [posts] = await pool.query(query, queryParams);

        // Consulta para el total de posts (con o sin filtro por path/title)
        let totalQuery = "SELECT COUNT(*) as total FROM ResPacksPosts";
        const totalParams = [];
        if (path || title) {
            totalQuery += ` WHERE `;
            if (path) {
                totalQuery += ` path = ? `;
                totalParams.push(path);
            }
            if (title) {
                if (path) totalQuery += ` AND `; // Agregar AND si ya hay un filtro de path
                totalQuery += ` title LIKE ? `;
                totalParams.push(`%${title}%`); // Búsqueda parcial con LIKE
            }
        }

        const [total] = await pool.query(totalQuery, totalParams);
        const totalPosts = total[0].total;
        const totalPages = Math.ceil(totalPosts / limitNumber);

        // Procesar las imágenes y etiquetas
        const postsWithImagesAndTags = posts.map((post) => ({
            ...post,
            images: post.images ? post.images.split(",") : [],
            tags: post.tags ? post.tags.split(",") : [],
        }));

        if (posts.length === 0) {
            return {
                success: false,
                message: "No se encontraron posts de tipo ResPacks",
                data: [],
                totalPosts,
                totalPages,
            };
        }

        return {
            success: true,
            message: "Posts de tipo ResPacks encontrados con éxito",
            data: postsWithImagesAndTags,
            totalPosts,
            totalPages,
        };
    }

    static async getAllPortfolio(page = 1, limit = 10, path = null, title = null) {
        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const offset = (pageNumber - 1) * limitNumber;

        // Construir la consulta SQL dinámicamente
        let query = `
            SELECT 
                PortfolioPosts.*, 
                GROUP_CONCAT(PostImages.image_url ORDER BY PostImages.image_order SEPARATOR ',') AS images,
                GROUP_CONCAT(DISTINCT tags.name SEPARATOR ',') AS tags
            FROM PortfolioPosts
            LEFT JOIN PostImages ON PortfolioPosts.id = PostImages.portfolio_post_id
            LEFT JOIN PortfolioPost_tags ON PortfolioPosts.id = PortfolioPost_tags.post_id
            LEFT JOIN tags ON PortfolioPost_tags.tag_id = tags.id
        `;

        // Parámetros para la consulta
        const queryParams = [];

        // Agregar filtros dinámicos
        if (path || title) {
            query += ` WHERE `;
            if (path) {
                query += ` PortfolioPosts.path = ? `;
                queryParams.push(path);
            }
            if (title) {
                if (path) query += ` AND `; // Agregar AND si ya hay un filtro de path
                query += ` PortfolioPosts.title LIKE ? `;
                queryParams.push(`%${title}%`); // Búsqueda parcial con LIKE
            }
        }

        query += `
            GROUP BY PortfolioPosts.id
            LIMIT ? OFFSET ?
        `;

        // Agregar límite y offset a los parámetros
        queryParams.push(limitNumber, offset);

        // Ejecutar la consulta para obtener los posts
        const [posts] = await pool.query(query, queryParams);

        // Consulta para el total de posts (con o sin filtro por path/title)
        let totalQuery = "SELECT COUNT(*) as total FROM PortfolioPosts";
        const totalParams = [];
        if (path || title) {
            totalQuery += ` WHERE `;
            if (path) {
                totalQuery += ` path = ? `;
                totalParams.push(path);
            }
            if (title) {
                if (path) totalQuery += ` AND `; // Agregar AND si ya hay un filtro de path
                totalQuery += ` title LIKE ? `;
                totalParams.push(`%${title}%`); // Búsqueda parcial con LIKE
            }
        }

        const [total] = await pool.query(totalQuery, totalParams);
        const totalPosts = total[0].total;
        const totalPages = Math.ceil(totalPosts / limitNumber);

        // Procesar las imágenes y etiquetas
        const postsWithImagesAndTags = posts.map((post) => ({
            ...post,
            images: post.images ? post.images.split(",") : [],
            tags: post.tags ? post.tags.split(",") : [],
        }));

        if (posts.length === 0) {
            return {
                success: false,
                message: "No se encontraron posts de tipo Portfolio",
                data: [],
                totalPosts,
                totalPages,
            };
        }

        return {
            success: true,
            message: "Posts de tipo Portfolio encontrados con éxito",
            data: postsWithImagesAndTags,
            totalPosts,
            totalPages,
        };
    }

    static async getById(id, type) {
        let connection;
        try {
            connection = await pool.getConnection();
            // Seleccionar la tabla correcta
            const tableName = type === 'respacks' ? 'ResPacksPosts' : 'PortfolioPosts';
            const tagTable = type === 'respacks' ? 'ResPacksPost_tags' : 'PortfolioPost_tags';

            // Obtener el post principal
            const [post] = await connection.execute(
                `SELECT * FROM ${tableName} WHERE id = ?`,
                [id]
            );

            if (post.length === 0) {
                return { success: false, message: "Post no encontrado." };
            }

            // Obtener imágenes relacionadas desde PostImages
            const [images] = await connection.execute(
                `SELECT image_url, image_order FROM PostImages WHERE 
                 ${type === 'respacks' ? 'respacks_post_id' : 'portfolio_post_id'} = ?
                 ORDER BY image_order`,
                [id]
            );


            // Obtener etiquetas relacionadas
            const [tags] = await connection.execute(
                `SELECT t.name FROM tags t 
                 INNER JOIN ${tagTable} pt ON t.id = pt.tag_id
                 WHERE pt.post_id = ?`,
                [id]
            );

            const data = { ...post[0], images, tags }

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error("Error al obtener el post:", error);
            return { success: false, message: "Fallo al obtener el post." };
        } finally {
            if (connection) connection.release();
        }
    }

    static async update(id, type, updatedFields = {}, newImages = [], newTags = []) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            let tableName;
            if (type === 'respacks') {
                tableName = 'ResPacksPosts';
            } else if (type === 'portfolio') {
                tableName = 'PortfolioPosts';
            } else {
                return { success: false, message: "Tipo de post no válido. Use 'respacks' o 'portfolio'." };
            }

            // Paso 1: Actualizar los campos del post
            if (Object.keys(updatedFields).length > 0) {
                const fieldsToUpdate = Object.keys(updatedFields)
                    .filter((key) => updatedFields[key] !== undefined) // Solo campos definidos
                    .map((key) => `${key} = ?`)
                    .join(', ');

                const valuesToUpdate = Object.values(updatedFields)
                    .filter((value) => value !== undefined);

                if (fieldsToUpdate.length > 0) {
                    const query = `UPDATE ${tableName} SET ${fieldsToUpdate} WHERE id = ?`;
                    await connection.execute(query, [...valuesToUpdate, id]);
                }
            }

            // Paso 2: Insertar nuevas imágenes en PostImages
            if (newImages.length > 0) {
                // Paso 1: Eliminar imágenes que no están en el nuevo arreglo
                const deleteImageQuery = `
                    DELETE FROM PostImages
                    WHERE ${type === "respacks" ? 'respacks_post_id' : 'portfolio_post_id'} = ?
                    AND image_url NOT IN (${newImages.map(() => '?').join(', ')})
                `;
                const values = [id, ...newImages];
                await connection.execute(deleteImageQuery, values);

                // Paso 2: Recuperar las imágenes existentes
                const getImageUrlsQuery = `SELECT image_url FROM PostImages WHERE ${type === "respacks" ? 'respacks_post_id' : 'portfolio_post_id'} = ?`;
                const [existingImages] = await connection.execute(getImageUrlsQuery, [id]);

                // Si no hay imágenes existentes, no hay nada que actualizar
                if (existingImages.length === 0) {
                    console.log("No hay imágenes para actualizar.");
                    return;
                }

                // Paso 3: Actualizar las imágenes existentes
                for (let i = 0; i < newImages.length; i++) {
                    const existingImage = existingImages.find(img => img.image_url === newImages[i]);

                    // Si la imagen existe, actualiza su orden
                    if (existingImage) {
                        const updateImageQuery = `
                            UPDATE PostImages 
                            SET image_order = ?, image_url = ?
                            WHERE ${type === "respacks" ? 'respacks_post_id' : 'portfolio_post_id'} = ? 
                            AND image_url = ?
                        `;
                        await connection.execute(updateImageQuery, [i + 1, newImages[i], id, newImages[i]]);
                    }
                }

                // Paso 4: Insertar las nuevas imágenes (si es que hay más imágenes que las existentes)
                if (existingImages.length < newImages.length) {
                    for (let i = existingImages.length; i < newImages.length; i++) {
                        const insertImageQuery = `
                            INSERT IGNORE INTO PostImages 
                                (post_type, respacks_post_id, portfolio_post_id, image_url, image_order) 
                            VALUES (?, ?, ?, ?, ?)
                        `;
                        await connection.execute(insertImageQuery, [
                            type === "portfolio" ? "Portfolio" : "ResPacks",
                            type === "portfolio" ? null : id,
                            type === "portfolio" ? id : null,
                            newImages[i],
                            i + 1 // Asegura que se asigna el orden correcto
                        ]);
                    }
                }
            }


            // Paso 3: Insertar nuevas etiquetas en tags y en la tabla de relación
            if (Array.isArray(newTags) && newTags.length > 0) {
                const tagTable = type === 'respacks' ? 'ResPacksPost_tags' : 'PortfolioPost_tags';

                // Obtener los tags actuales del post
                const [currentTags] = await connection.execute(
                    `SELECT t.name FROM tags t 
                     INNER JOIN ${tagTable} pt ON t.id = pt.tag_id
                     WHERE pt.post_id = ?`,
                    [id]
                );

                const currentTagNames = currentTags.map(tag => tag.name);

                // Eliminar los tags que no están en newTags
                const tagsToRemove = currentTagNames.filter(tag => !newTags.includes(tag));
                if (tagsToRemove.length > 0) {
                    const removeTagQueries = tagsToRemove.map(async (tag) => {
                        const [tagResult] = await connection.execute(
                            `SELECT id FROM tags WHERE name = ?`,
                            [tag]
                        );
                        if (tagResult.length > 0) {
                            const tagID = tagResult[0].id;
                            await connection.execute(
                                `DELETE FROM ${tagTable} WHERE post_id = ? AND tag_id = ?`,
                                [id, tagID]
                            );
                        }
                    });
                    await Promise.all(removeTagQueries);
                }

                // Insertar los nuevos tags
                const tagQueries = newTags.map(async (tag) => {
                    const [tagResult] = await connection.execute(
                        `SELECT id FROM tags WHERE name = ?`,
                        [tag]
                    );

                    let tagID;
                    if (tagResult.length > 0) {
                        tagID = tagResult[0].id;
                    } else {
                        const [insertResult] = await connection.execute(
                            `INSERT IGNORE INTO tags (name) VALUES (?)`,
                            [tag]
                        );
                        tagID = insertResult.insertId;
                    }

                    await connection.execute(
                        `INSERT IGNORE INTO ${tagTable} (post_id, tag_id) VALUES (?, ?)`,
                        [id, tagID]
                    );
                });
                await Promise.all(tagQueries);
            }

            await connection.commit();
            return { success: true, message: "Post actualizado con éxito." };
        } catch (error) {
            if (connection) await connection.rollback();
            console.error("Error al actualizar el post:", error);
            return { success: false, message: "Fallo al actualizar el post." };
        } finally {
            if (connection) connection.release();
        }
    }

    static async delete(id, type) {
        let connection;
        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            let tableName;
            if (type === 'respacks') {
                tableName = 'ResPacksPosts';
            } else if (type === 'portfolio') {
                tableName = 'PortfolioPosts';
            } else {
                return { success: false, message: "Tipo de post no válido. Use 'respacks' o 'portfolio'." };
            }

            await connection.execute(
                `DELETE FROM PostImages 
                 WHERE (post_type = ? AND respacks_post_id = ?) OR 
                       (post_type = ? AND portfolio_post_id = ?)`,
                [type === 'respacks' ? 'ResPacks' : 'Portfolio', id, type === 'respacks' ? 'ResPacks' : 'Portfolio', id]
            );

            const [response] = await connection.execute(
                `DELETE FROM ${tableName} WHERE id = ?`,
                [id]
            );

            if (response.affectedRows > 0) {
                await connection.commit();
                return { success: true, message: "Post eliminado con éxito." };
            } else {
                await connection.rollback();
                return { success: false, message: "No se encontró el post con esa ID." };
            }
        } catch (error) {
            if (connection) await connection.rollback();
            console.error("Error al eliminar el post:", error);
            return { success: false, message: "Error al eliminar el post." };
        } finally {
            if (connection) connection.release();
        }
    }
}