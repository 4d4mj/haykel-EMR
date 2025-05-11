// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth/next';
import type { NextAuthOptions } from 'next-auth';
import type { Account, Profile, Session, User as NextAuthUser } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import prisma from '../../../../lib/prisma';
import type { Role as PrismaRoleType, Permission as PrismaPermissionType, UserRole, RolePermission, UserPermission } from '@generated/prisma';

export const runtime = 'nodejs';

type UserRoleWithRelations = UserRole & {
  role: PrismaRoleType & {
    permissions: (RolePermission & {
      permission: PrismaPermissionType;
    })[];
  };
};

type UserPermissionWithRelations = UserPermission & {
  permission: PrismaPermissionType;
};

// Define types for callback parameters for clarity
interface AuthorizeCredentials {
  email?: string;
  password?: string;
  [key: string]: unknown; // For other potential credentials
}

interface JwtCallbackParams {
  token: JWT;
  user?: NextAuthUser | AdapterUser; // Extended via module augmentation
  account?: Account | null;
  profile?: Profile;
  isNewUser?: boolean;
  trigger?: "signIn" | "signUp" | "update";
  session?: Record<string, unknown>; // Data for session update trigger
}

// Session callback uses Session and JWT types augmented
interface SessionCallbackParams {
  session: Session;
  token: JWT;
}


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: AuthorizeCredentials | undefined): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.passwordHash && await compare(credentials.password, user.passwordHash)) {
          const userWithDetails = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
              permissions: { include: { permission: true } },
            },
          });

          if (!userWithDetails) return null;

          const roles: string[] = [];
          const permissions = new Set<string>();

          (userWithDetails.roles as UserRoleWithRelations[]).forEach((userRole) => {
            roles.push(userRole.role.name);
            userRole.role.permissions.forEach((rolePermission) => {
              permissions.add(rolePermission.permission.name);
            });
          });

          (userWithDetails.permissions as UserPermissionWithRelations[]).forEach((userDirectPermission) => {
            permissions.add(userDirectPermission.permission.name);
          });

          return {
            id: userWithDetails.id,
            email: userWithDetails.email,
            name: userWithDetails.name,
            image: userWithDetails.image,
            roles,
            permissions: Array.from(permissions),
          };
        } else {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: JwtCallbackParams): Promise<JWT> {
      if (user) {
        const u = user as NextAuthUser;
        token.id = u.id;
        token.roles = u.roles;
        token.permissions = u.permissions;
      }
      return token;
    },

    async session({ session, token }: SessionCallbackParams): Promise<Session> {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Your custom sign-in page
  },
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
