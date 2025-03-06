import { Hono } from 'hono'
import  { authController }  from '@/controllers/auth.controller.js'
import { authMiddleware } from '@/middlewares/auth.middleware.js'

const auth = new Hono()

auth.post("/auth/register", authController.register)
auth.post("/auth/login", authController.login)
auth.get("/auth/me", authMiddleware, authController.me)

export default auth