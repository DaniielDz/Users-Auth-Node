import { Router } from "express";
import { PostController } from "../controllers/postController.js"
import { processGallery } from "../middlewares/uploadGallery.js";

const router = Router()

router.post('/', processGallery, PostController.create)
router.get('/', PostController.getAll)
router.get('/:id', PostController.getById)
router.patch('/:id', processGallery,PostController.update)
router.delete('/:id', PostController.delete)

export default router;