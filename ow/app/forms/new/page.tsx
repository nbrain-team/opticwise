import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import FormEditor from "../FormEditor";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const publicHost = (process.env.PLATFORM_PUBLIC_URL || "https://ownet.opticwise.com").replace(
    /\/+$/,
    ""
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <FormEditor publicHost={publicHost} />
    </div>
  );
}
