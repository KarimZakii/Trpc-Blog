import { OpenApiRouter } from "trpc-openapi";
import { t } from "../trpc";
import { authRouter } from "./auth.router";
import { postRouter } from "./post.router";

export const appRouter = t.router({
  auth: authRouter,
  post: postRouter,
}) as OpenApiRouter;

export type AppRouter = typeof appRouter;
