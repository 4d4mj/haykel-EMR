// src/components/auth/withAuthorization.tsx

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ComponentType, FC } from "react";
import type { Permission, Role } from "@/constants/auth";

export interface AuthorizationOptions {
	requiredPermissions?: Permission[];
	requiredRoles?: Role[];
	redirectTo?: string;
}

export function withAuthorization<P extends object>(Wrapped: ComponentType<P>, opts: AuthorizationOptions) {
  const Component: FC<P> = async (props) => {
    // we assume middleware already verified authentication
    const { requiredRoles = [], requiredPermissions = [], redirectTo = "/unauthorized" } = opts;

    const session = await auth();

    const roles = session?.user?.roles ?? [];
    const perms = session?.user?.permissions ?? [];

    if (requiredRoles.some(r => roles.includes(r)) &&
        requiredPermissions.every(p => perms.includes(p))) {
      return <Wrapped {...props} />;
    }
    redirect(redirectTo);
  };

  Component.displayName = `withAuthorization(${Wrapped.displayName ?? Wrapped.name ?? "Component"})`;
  return Component;
}

