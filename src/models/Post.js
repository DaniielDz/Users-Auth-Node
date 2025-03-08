import { pool } from "../config/db.js";

export class Post {
    static async create(
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
    ) {
        const [result] = await pool.execute('INSERT INTO post (title,path, firstTxtField, secondTxtField, progress, version, resolution, dwnFileLink, seconds, embed, tags, optifine) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [
            title,
            category,
            firstTxt,
            secondTxt,
            progress,
            version,
            resolution,
            download,
            seconds,
            embed,
            tags,
            optifine
        ])

        const postID = result.insertId

        console.log(gallery);
        

        if(gallery && gallery.length > 0) {
            for (const imgUrl of gallery) {
                await pool.execute("INSERT INTO gallery (post_id, image_url) VALUES (?,?)", [postID, imgUrl])
            }
        }

        if (result.affectedRows > 0) {
            return { success: true, message: "Post creado con éxito." }
        } else {
            return { success: false, message: "Fallo al crear el post." }
        }
    }

    static async getById(id) {
        const [result] = await pool.execute('Select (content) from post where id = (?)', [id])

        if (result.length > 0) {
            return { success: true, data: result[0] };
        } else {
            return { success: false, message: "No se encontraron posts con esa ID" }
        }
    }
}