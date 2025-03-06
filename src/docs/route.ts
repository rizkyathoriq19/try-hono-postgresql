
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const swagger = new OpenAPIHono();

/**
 * 🔹 Route: Register User
 */
swagger.openapi(
    createRoute({
        method: "post",
        path: "/auth/register",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            fullName: z.string().min(1, "Full name is required"),
                            username: z.string().min(1, "Username is required"),
                            email: z.string().email("Invalid email address"),
                            password: z.string().min(6, "Password must be at least 6 characters"),
                            confirmPassword: z.string().min(6, "Confirm password is required"),
                        }),
                    },
                },
            },
        },
        responses: {
            201: {
                description: "User registered successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            id: z.string(),
                            fullName: z.string(),
                            username: z.string(),
                            email: z.string(),
                        }),
                    },
                },
            },
            400: {
                description: "Invalid input data",
                content: {
                    "application/json": {
                        schema: z.object({ error: z.string() }),
                    },
                },
            },
        },
    }),
    async (c) => {
        try {
        const body = await c.req.json();
        const { fullName, username, email, password, confirmPassword } = body;

        if (password !== confirmPassword) {
            return c.json({ error: "Passwords do not match" }, 400);
        }

        const newUser = {
            id: "123",
            fullName,
            username,
            email,
        };

        return c.json(newUser, 201);
        } catch (error) {
            return c.json({ error: "Invalid input" }, 400);
        }
    }
);

/**
 * 🔹 Route: Login User
 */
swagger.openapi(
    createRoute({
        method: "post",
        path: "/auth/login",
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: z.object({
                            identifier: z.string().min(1, "Username or Email is required"),
                            password: z.string().min(6, "Password must be at least 6 characters"),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: "User logged in successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            user: z.object({
                                id: z.string(),
                                fullName: z.string(),
                                username: z.string(),
                                email: z.string(),
                            }),
                            token: z.string(),
                        }),
                    },
                },
            },
            400: {
                description: "Invalid input data",
                content: {
                    "application/json": {
                        schema: z.object({ error: z.string() }),
                    },
                },
            },
            401: {
                description: "Invalid credentials",
                content: {
                    "application/json": {
                        schema: z.object({ error: z.string() }),
                    },
                },
            },
        },
    }),
    async (c) => {
        try {
        const body = await c.req.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return c.json({ error: "Invalid input data" }, 400);
        }

        const user = identifier === "testuser" ? {
            id: "123",
            fullName: "Test User",
            username: "testuser",
            email: "test@example.com",
        } : null;

        if (!user || password !== "password123") {
            return c.json({ error: "Invalid username/email or password" }, 401);
        }
        
        const token = "mocked-jwt-token";

        return c.json({ user, token }, 200);
        } catch (error) {
            return c.json({ error: "Invalid input" }, 400);
        }
    }
);


/**
 * 🔹 Route: Get User Profile
 */
swagger.openapi(
    createRoute({
        method: "get",
        path: "/auth/me",
        security: [{ BearerAuth: [] }],
        responses: {
            200: {
                description: "User details",
                content: {
                    "application/json": {
                        schema: z.object({
                            id: z.string(),
                            fullName: z.string(),
                            username: z.string(),
                            email: z.string(),
                        }),
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: z.object({ error: z.string() }),
                    },
                },
            },
        },
    }),
    async (c) => {
        try {
        const authHeader = c.req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const token = authHeader.split(" ")[1];

        if (token !== "mocked-jwt-token") {
            return c.json({ error: "Invalid token" }, 401);
        }

        const user = {
            id: "123",
            fullName: "Test User",
            username: "testuser",
            email: "test@example.com",
        };

        return c.json(user, 200);
        } catch (error) {
            return c.json({ error: "Unauthorized" }, 401);
        }
    }
);

export default swagger;
