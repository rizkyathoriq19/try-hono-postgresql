import { PrismaClient } from "@prisma/client";
import { encrypt } from "@/utils/encryption.js";

const prisma = new PrismaClient();

prisma.$extends({
  query: {
    user: {
      async create({ args, query }) {
        if (args.data.password) {
          const { hash } = encrypt(args.data.password);
          args.data.password = hash;
        }
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.password && typeof args.data.password === "string") {
          const { hash } = encrypt(args.data.password);
          args.data.password = { set: hash };
        }
        return query(args);
      },
    },
  },
});

export default prisma;
