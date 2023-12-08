import { TRPCError } from "@trpc/server";
import { publicProcedure, t } from "../trpc";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const authRouter = t.router({
  register: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/register",
        tags: ["auth"],
        summary: "To register a new user",
      },
    })
    .output(
      z.object({
        registeredUser: z.object({
          id: z.number(),
          name: z.string(),
        }),
      })
    )
    .input(
      z.object({
        name: z.string().min(3, "Name must not bet less than 3 characters"),
        email: z.string().email(),
        password: z
          .string()
          .min(5, "Password cannot be less than 5 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let user = await ctx.prisma.user.findFirst({
        where: { email: input.email },
      });
      if (user) {
        throw new TRPCError({
          message: "A USER ALREADY EXISTS WITH THIS EMAIL",
          code: "UNAUTHORIZED",
        });
      }
      const hashedPw = await bcrypt.hash(input.password, 10);

      const registeredUser = await ctx.prisma.user.create({
        data: { ...input, password: hashedPw },
      });
      return {
        registeredUser: { id: registeredUser.id, name: registeredUser.name },
      };
    }),
  login: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/auth/login",
        tags: ["auth"],
        summary: "To login a user",
      },
    })
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .output(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { email: input.email },
      });
      if (!user) {
        throw new TRPCError({
          message:
            "Wrong credentials , Please check your email and password again",
          code: "NOT_FOUND",
        });
      }
      const isEqual = await bcrypt.compare(input.password, user.password);
      if (!isEqual) {
        throw new TRPCError({
          message:
            "Wrong credentials , Please check your email and password again",
          code: "NOT_FOUND",
        });
      }
      return {
        token: jwt.sign({ userId: user.id }, "secret"),
      };
    }),
});
