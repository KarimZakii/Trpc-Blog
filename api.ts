import express from "express";
import { initTRPC } from "@trpc/server";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { createContext } from "./context";
import { OpenApiMeta } from "trpc-openapi";
import { createOpenApiExpressMiddleware } from "trpc-openapi";
import { appRouter } from "./routers/index";

const t = initTRPC.meta<OpenApiMeta>().create();

const app = express();

app.use("/api", createExpressMiddleware({ router: appRouter, createContext }));
app.use(
  "/openapi",
  createOpenApiExpressMiddleware({ router: appRouter, createContext })
);

app.listen(3000);

export type AppRouter = typeof appRouter;
