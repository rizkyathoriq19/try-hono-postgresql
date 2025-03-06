import type { Context } from "hono";
import type { IUserToken } from "@/utils/jwt.js";

export interface IReqContext extends Context<{ Variables: { user: IUserToken } }> {}
