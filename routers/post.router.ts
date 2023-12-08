import { z } from "zod";
import { protectedProcedure, publicProcedure, t } from "../trpc";
import { TRPCError } from "@trpc/server";

const PostsSchema = z.object({
  posts: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      content: z.string(),
      authorId: z.number(),
    })
  ),
});

export const postRouter = t.router({
  list: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/posts",
        tags: ["posts"],
        summary: "getting all posts",
      },
    })
    .input(
      z.object({ page: z.number()?.default(10), limit: z.number()?.default(1) })
    )
    .output(PostsSchema)
    .query(async ({ ctx }) => {
      const posts = await ctx.prisma.post.findMany();
      return { posts };
    }),

  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/create",
        tags: ["posts"],
        summary: "creating a post",
      },
    })
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    )
    .output(
      z.object({
        createdPost: z.object({
          content: z.string(),
          title: z.string(),
          author: z.string(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const createdPost = await ctx.prisma.post.create({
        data: {
          content: input.content,
          title: input.title,
          authorId: ctx.user.id,
        },
      });
      return {
        createdPost: {
          content: createdPost.content,
          title: createdPost.title,
          author: ctx.user.name,
        },
      };
    }),
  update: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/update",
        tags: ["posts"],
        summary: "updating a post",
      },
    })
    .input(z.object({ id: z.number(), content: z.string() }))
    .output(
      z.object({
        updatedPost: z.object({
          id: z.number(),
          title: z.string(),
          content: z.string(),
          authorId: z.number(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const post = await ctx.prisma.post.findFirst({ where: { id: input.id } });
      if (post?.id != ctx.user.id) {
        throw new TRPCError({
          message: "You can only delete or update your posts",
          code: "UNAUTHORIZED",
        });
      }
      const updatedPost = await ctx.prisma.post.update({
        where: { id: input.id },
        data: { content: input.content },
      });
      return { updatedPost };
    }),

  delete: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/delete",
        tags: ["posts"],
        summary: "deleting a post",
      },
    })
    .input(z.object({ id: z.number() }))
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const post = await ctx.prisma.post.findFirst({ where: { id: input.id } });
      if (post?.id != ctx.user.id) {
        throw new TRPCError({
          message: "You can only delete or update your posts",
          code: "UNAUTHORIZED",
        });
      }
      const deletedPost = await ctx.prisma.post.delete({
        where: { id: input.id },
      });
      return { message: "Post deleted successfully" };
    }),
  userRelatedPosts: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/userposts",
        tags: ["posts"],
        summary: "finding user related posts",
      },
    })
    .input(
      z.object({ page: z.number()?.default(10), limit: z.number()?.default(1) })
    )
    .output(PostsSchema)
    .query(async ({ ctx }) => {
      const posts = await ctx.prisma.post.findMany({
        where: { authorId: ctx.user.id },
      });
      return { posts };
    }),
});
