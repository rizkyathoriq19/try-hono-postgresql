import { z } from 'zod'
import { encrypt } from '@/utils/encryption.js'
import { generateToken } from '@/utils/jwt.js'
import { type User } from '@prisma/client'
import type { Context } from 'hono'
import prisma from '@/lib/prisma.js'

type TRegister = {
    fullName: string
    username: string
    email: string
    password: string
    confirmPassword: string
}

type TLogin = {
    identifier: string
    password: string
}

const registerValidationSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(6, "Password must be at least 6 characters long")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/\d/, "Must contain at least one numeric character"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}).superRefine(async (data, ctx) => {
    const existingUser = await prisma.$queryRaw<User[]>`
      SELECT * FROM "user" WHERE username = ${data.username} OR email = ${data.email};
    `;

    if (existingUser.length > 0) {
        if (existingUser[0].username === data.username) {
            ctx.addIssue({
                code: "custom",
                path: ["username"],
                message: "Username is already taken",
            });
        }
        if (existingUser[0].email === data.email) {
            ctx.addIssue({
                code: "custom",
                path: ["email"],
                message: "Email is already registered",
            });
        }
    }
});

export const authController = {
    async register(c: Context) {
        /**
         #swagger.tags = ['Auth']
            #swagger.summary = 'Register a new user'
            #swagger.description = 'This endpoint allows users to register a new account'
            #swagger.parameters['newUser'] = {
                in: 'body',
                description: 'User information',
                required: true,
                schema: { $ref: '#/definitions/Register' }
            }
            #swagger.responses[201] = {
                description: 'User registered successfully',
                schema: { $ref: '#/definitions/User' }
            }
            #swagger.responses[400] = {
                description: 'Invalid input data',
                schema: { $ref: '#/definitions/Error' }
            }
         */

        const body = await c.req.json<TRegister>()
        const { fullName, username, email, password } = body

        try {
            await registerValidationSchema.parseAsync(body)
            
            const result = await prisma.$transaction(async (tx) => {
            const user = await tx.$queryRaw<User[]>`
                INSERT INTO "user" ("fullName", "username", "email", "password")
                VALUES (${fullName}, ${username}, ${email}, ${password})
                RETURNING id, "fullName", username, email;
            `;
            
            return user[0]; 
            });


            return c.json(result, 201);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: error.errors.map(e => e.message).join(', ') }, 400);
            }
            return c.json({ error: "Invalid input" }, 400);
        }
    },
    async login(c: Context) { },
    async me(c: Context) { },
}

