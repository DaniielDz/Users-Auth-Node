import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

router.get('/check-auth', verifyToken, (req, res) => {
    res.json({ authenticated: true, user: req.user });
});

export default router;