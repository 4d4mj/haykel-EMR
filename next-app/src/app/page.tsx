import { auth } from "@/lib/auth";
import { withAuthorization } from "@/components/auth/WithAuth";
import { PERMISSIONS, ROLES } from "@/constants/auth";

async function HomePage() {
  const session = await auth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Welcome to the Dashboard, {session?.user?.name}!</h1>
      <p>Your Email: {session?.user?.email}</p>
      <p>Your Roles: {session?.user?.roles?.join(", ")}</p>
      <p>Your Permissions: {session?.user?.permissions?.join(", ")}</p>
      <p className="mt-4 text-green-600">You have the required access to see this page.</p>
      </div>
  );
}

const homePageAuthOptions = {
  requiredPermissions: [PERMISSIONS.EDIT_BILLING_INFO],
  requiredRoles: [ROLES.BILLING_STAFF],
  redirectTo: "/forbidden",
};

export default withAuthorization(HomePage, homePageAuthOptions);
