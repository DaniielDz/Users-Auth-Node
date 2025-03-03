import pkg from 'jsonwebtoken';
const { verify } = pkg;

export function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Acceso denegado' });

    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token inválido' });
    }
}
