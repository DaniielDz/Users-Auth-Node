import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './src/routes/authRoutes.js'
import postRoutes from './src/routes/postRoutes.js'

dotenv.config()
const app = express()

const PORT = process.env.PORT ?? 3000

// Midlewares
app.disable('x-powered-by')
// Aumentar el límite de tamaño del cuerpo de la solicitud
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser())
app.use(cors({ 
  credentials: true, 
  origin: ['http://localhost:5173', 'https://craftedia.netlify.app'] 
}))

app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes)

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
