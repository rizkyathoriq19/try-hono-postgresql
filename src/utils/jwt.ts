import { sign, verify } from "hono/jwt";
import { SECRET } from "@/utils/env.js";

export interface IUserToken {
    id: string | number;
    role: "USER" | "ADMIN";
    profilePicture?: string;
    exp?: number;
    [key: string]: any;
}

export const generateToken = (user: IUserToken) => {
    const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60;
    const token = sign({ ...user, exp: expiresIn }, SECRET);

    return token;
};

export const getUserData = async (token: string): Promise<IUserToken> => { 
    const user = await verify(token, SECRET).catch(() => null);
    if (!user) throw new Error("Invalid token");
    return user as IUserToken;
};
