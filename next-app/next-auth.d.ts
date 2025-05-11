import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      roles?: string[];
      permissions?: string[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    roles?: string[];
    permissions?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: string[];
    permissions?: string[];
  }
}
