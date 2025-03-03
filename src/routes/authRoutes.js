import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Ruta protegida', user: req.user });
});

export default router;
