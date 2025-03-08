import { Router } from "express";
import { PostController } from "../controllers/postController.js"
import { processGallery } from "../middlewares/uploadGallery.js";

const router = Router()

router.post('/', processGallery, PostController.create)
router.get('/:id', PostController.getById)

export default router;