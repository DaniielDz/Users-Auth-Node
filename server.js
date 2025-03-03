import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './src/routes/authRoutes.js'

dotenv.config()
const app = express()

const PORT = process.env.PORT ?? 3000

// Midlewares
app.disable('x-powered-by')
app.use(express.json())
app.use(cookieParser())
app.use(cors({ credentials: true, origin: 'http://localhost:5500' }))

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`)
})
