import { Hono } from 'hono'
import  { authController }  from '@/controllers/auth.controller.js'

const auth = new Hono()

auth.post("/auth/register", authController.register)
auth.post("/auth/login", authController.login)

export default auth