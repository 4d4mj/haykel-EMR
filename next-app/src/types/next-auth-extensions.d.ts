// types/next-auth-extensions.d.ts

import type { Session as DefaultSession, User as DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

interface BaseCustomAuthProperties { // Renamed to avoid confusion if used elsewhere
  roles?: string[];
  permissions?: string[];
  name?: string | null;
  email?: string | null;
  image?: string | null; // For User object
}

// For User and Session.user, 'id' IS expected to be there and non-optional once authenticated.
interface UserSpecificCustomAuthProperties extends BaseCustomAuthProperties {
  id: string; // User ID is non-optional here
}

// For JWT, 'id' (mapping to 'sub') can sometimes be optional in the base type,
// or during certain phases. It's safer to keep it optional here if DefaultJWT has sub as optional.
// It will be populated from the user object.
interface JWTSpecificCustomAuthProperties extends BaseCustomAuthProperties {
  id?: string; // JWT 'id' (from token.sub usually) can be optional in DefaultJWT
  picture?: string | null; // For JWT's 'picture' claim
}


declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & UserSpecificCustomAuthProperties;
  }
  interface User extends DefaultUser, UserSpecificCustomAuthProperties {}
}

declare module "next-auth/jwt" {
  // Ensure this JWT interface is compatible with what the jwt callback expects to receive and return.
  // If DefaultJWT has 'sub' as optional, 'id' here should also be optional.
  interface JWT extends DefaultJWT, JWTSpecificCustomAuthProperties {}
}

export {};
