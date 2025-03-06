import { Hono } from 'hono'
import  { authController }  from '@/controllers/auth.controller.js'

const auth = new Hono()

auth.post("/auth/register", authController.register)

export default auth