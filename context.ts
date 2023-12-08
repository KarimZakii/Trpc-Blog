import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

const prisma = new PrismaClient();
const jwtSecret = "secret";

type User = {
  id: number;
  name: string;
  email: string;
};

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  let user: User | null = null;
  try {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, jwtSecret) as { userId: number };
      const userId = decodedToken.userId;
      if (userId) {
        user = (await prisma.user.findFirst({ where: { id: userId } })) ?? null;
      }
    }
  } catch (error: any) {
    // throw new TRPCError({
    //   message: error.message,
    //   code: "INTERNAL_SERVER_ERROR",
    // });
    res.json({ message: error.message });
  }

  return { user, prisma };
};
