import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { ALL_MODULE_KEYS, type ModuleKey } from "@/lib/modules";

/**
 * Returns the modules a user is allowed to access.
 * Admins get all modules regardless of their allowedModules array.
 */
export async function getUserModules(userId: string): Promise<ModuleKey[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, allowedModules: true },
  });

  if (!user) return [];
  if (user.role === "admin") return ALL_MODULE_KEYS;

  if (!user.allowedModules || user.allowedModules.length === 0) return [];
  return user.allowedModules as ModuleKey[];
}

/**
 * Server component guard: redirects to /dashboard if the current user
 * does not have access to the given module. Call at the top of any
 * restricted page's server component.
 */
export async function checkModuleAccess(moduleKey: ModuleKey): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const modules = await getUserModules(session.userId);
  if (!modules.includes(moduleKey)) {
    redirect("/dashboard");
  }
}
