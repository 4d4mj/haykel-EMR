import { auth } from "@/lib/auth";

export default async function Home() {

  const session = await auth();

  console.log("Session data:", session);
  return (
    <div className="bg-red-400">{session?.user.name}</div>
  );
}
