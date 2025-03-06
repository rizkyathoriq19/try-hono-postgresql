import type { Context } from 'hono'
import { z } from 'zod'
import { generateToken } from '@/utils/jwt.js'
import { type User } from '@prisma/client'
import prisma from '@/lib/prisma.js'
import type { IReqUser } from '@/middlewares/auth.middleware.js'

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
    async login(c: Context) {
        /**
        #swagger.tags = ['Auth']
            #swagger.summary = 'Login'
            #swagger.description = 'This endpoint allows users to login'
            #swagger.parameters['login'] = {
                in: 'body',
                description: 'User login information',
                required: true,
                schema: { $ref: '#/definitions/Login' }
            }
            #swagger.responses[200] = {
                description: 'User logged in successfully',
                schema: { $ref: '#/definitions/User' }
            }
            #swagger.responses[400] = {
                description: 'Invalid input data',
                schema: { $ref: '#/definitions/Error' }
            }
            #swagger.responses[401] = {
                description: 'Invalid credentials',
                schema: { $ref: '#/definitions/Error' }
            }
         */

        const body = await c.req.json<TLogin>()
        const { identifier, password } = body

        try {
            const userByIndentifier = await prisma.$queryRaw<User[]>`
                SELECT id, "fullName", username, email 
                FROM "user"
                WHERE (username = ${identifier} OR email = ${identifier}) 
                AND password = crypt(${password}, password);
            `;

            if(userByIndentifier.length === 0) {
                return c.json({ error: "Invalid username/email or password" }, 401);
            }
            
            const token = await generateToken({
                id: userByIndentifier[0].id,
                role: userByIndentifier[0].role,
            });

            return c.json({ user: userByIndentifier[0], token }, 200);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: error.errors.map(e => e.message).join(', ') }, 400);
            }
            return c.json({ error: "Invalid input" }, 400);
        }
        
    },
    async me(c: IReqUser) { 
        /**
        #swagger.tags = ['Auth']
        #swagger.security = [{ "BearerAuth": [] }]
        #swagger.summary = 'Get user profile'
        #swagger.description = 'This endpoint allows users to get their profile'
        #swagger.responses[200] = {
            description: 'User profile',
            schema: { $ref: '#/definitions/User' }
        }
        #swagger.responses[401] = {
            description: 'Unauthorized',
            schema: { $ref: '#/definitions/Error' }
        }
        */
        try {
            const user = c.get("user");
            if (!user) return c.json({ error: "Unauthorized" }, 401);
            
            const result = await prisma.$queryRaw<User[]>`
                SELECT id, "fullName", username, email
                FROM "user"
                WHERE id = ${user.id};
            `;

            return c.json(result[0], 200);
        } catch (error) {
            if (error instanceof z.ZodError) {
                return c.json({ error: error.errors.map(e => e.message).join(', ') }, 400);
            }
            return c.json({ error: "Invalid input" }, 400);
        }
    },
}

