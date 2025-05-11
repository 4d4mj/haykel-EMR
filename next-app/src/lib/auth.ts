// src/lib/auth.ts
import NextAuth from "next-auth";
// For core types like User, Session, Account, Profile, use 'next-auth' or '@auth/core/types'
// The exact source can sometimes vary slightly between beta versions.
// If 'next-auth' doesn't directly export them, '@auth/core/types' is the canonical source.
import type {
  User as AuthUser, // Base User type from the core
  Session as AuthSession,
  Account,
  Profile
  // AdapterUser might be from '@auth/core/adapters' if needed explicitly,
  // but often AuthUser is sufficient for callback parameters.
} from "next-auth"; // Or try from "@auth/core/types" if direct export fails
import type { JWT as AuthJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import type { NextAuthConfig, User as NextAuthAdapterUser } from "next-auth"; // NextAuthConfig for config, NextAuthAdapterUser for adapter interactions if specifically needed.

// --- Extended Types (Refined) ---
interface ExtendedUser extends AuthUser { // Extends the base AuthUser
  id: string;
  roles?: string[];
  permissions?: string[];
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ExtendedJWT extends AuthJWT {
  id?: string;
  roles?: string[];
  permissions?: string[];
  name?: string | null;
  email?: string | null;
  picture?: string | null;
}

// Helper functions (no change)
async function fetchRoles(uid: string): Promise<string[]> {
  const list = await prisma.userRole.findMany({
    where: { userId: uid },
    select: { role: { select: { name: true } } },
  });
  return list.map((r) => r.role.name);
}

async function fetchPerms(uid: string): Promise<string[]> {
  const directPermissions = await prisma.userPermission.findMany({
    where: { userId: uid },
    select: { permission: { select: { name: true } } },
  });
  const permissionsFromRoles = await prisma.rolePermission.findMany({
    where: { role: { users: { some: { userId: uid } } } },
    select: { permission: { select: { name: true } } },
  });
  const allPerms = new Set([
    ...directPermissions.map(p => p.permission.name),
    ...permissionsFromRoles.map(p => p.permission.name)
  ]);
  return Array.from(allPerms);
}

export const config = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials_raw): Promise<ExtendedUser | null> {
        if (
          !credentials_raw ||
          typeof credentials_raw.email !== "string" ||
          typeof credentials_raw.password !== "string"
        ) {
          console.error("Invalid credentials format:", credentials_raw);
          return null;
        }
        const email = credentials_raw.email;
        const password = credentials_raw.password;

        const userFromDb = await prisma.user.findUnique({ where: { email } }); // Renamed to avoid conflict
        if (!userFromDb || !userFromDb.passwordHash) {
          return null;
        }
        const isPasswordValid = await compare(password, userFromDb.passwordHash);
        if (!isPasswordValid) {
          return null;
        }
        return {
          id: userFromDb.id,
          name: userFromDb.name,
          email: userFromDb.email,
          image: userFromDb.image,
          roles: await fetchRoles(userFromDb.id),
          permissions: await fetchPerms(userFromDb.id),
        };
      },
    }),
  ],
  callbacks: {
    async jwt(params: {
      token: AuthJWT;
      user?: AuthUser; // Use base AuthUser. If from 'authorize', it will have the extended fields.
      account?: Account | null;
      profile?: Profile;
      isNewUser?: boolean;
      trigger?: "signIn" | "signUp" | "update";
      session?: unknown; // Data passed to session.update(), use unknown instead of any
    }): Promise<AuthJWT> {
      const { token, user } = params;

      if (user) {
        // If 'user' is present, it's from 'authorize' (which returns ExtendedUser)
        // or from an OAuth provider.
        const u = user as ExtendedUser; // Safe to cast here if from authorize
        (token as ExtendedJWT).id = u.id;
        (token as ExtendedJWT).roles = u.roles;
        (token as ExtendedJWT).permissions = u.permissions;
        (token as ExtendedJWT).name = u.name;
        (token as ExtendedJWT).email = u.email;
        (token as ExtendedJWT).picture = u.image;
      }
      return token;
    },

    async session(params: {
      session: AuthSession;
      token: AuthJWT; // This token is the one returned from the jwt callback
      user: NextAuthAdapterUser; // In v5, this 'user' in session callback is often the AdapterUser
    }): Promise<AuthSession> {
      const { session, token } = params;
      const extendedToken = token as ExtendedJWT; // Token from jwt callback has our custom props

      if (session.user && extendedToken.id) {
        const userInSession = session.user as ExtendedUser;
        userInSession.id = extendedToken.id; // id from token is string (or undefined if not set)
        userInSession.roles = extendedToken.roles;
        userInSession.permissions = extendedToken.permissions;
        userInSession.name = extendedToken.name;
        userInSession.email = extendedToken.email;
        userInSession.image = extendedToken.picture;
      } else if (extendedToken.id) {
         // If session.user doesn't exist, but token has an id, reconstruct.
        session.user = {
            id: extendedToken.id, // id from token
            name: extendedToken.name,
            email: extendedToken.email,
            image: extendedToken.picture,
            roles: extendedToken.roles,
            permissions: extendedToken.permissions,
        } as ExtendedUser; // Assert as ExtendedUser
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(config);
