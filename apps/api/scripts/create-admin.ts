// One-time setup: creates (or updates the password of) an AdminUser row.
// There's no self-serve admin signup by design — admin accounts are
// provisioned out-of-band.
//
// Run with: bun run --cwd=apps/api create-admin -- <email> <password> <name> [role]
// role defaults to SUPER_ADMIN (one of SUPER_ADMIN, ADMIN, STAFF).
import { prisma } from "@rajadhaniyam/database";

const [email, password, name, role = "SUPER_ADMIN"] = process.argv.slice(2);

if (!email || !password || !name) {
  console.error("Usage: bun run --cwd=apps/api create-admin -- <email> <password> <name> [role]");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}
if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
  console.error(`Invalid role "${role}" — must be SUPER_ADMIN, ADMIN or STAFF.`);
  process.exit(1);
}

const passwordHash = await Bun.password.hash(password);

const admin = await prisma.adminUser.upsert({
  where: { email },
  create: { email, passwordHash, name, role: role as "SUPER_ADMIN" | "ADMIN" | "STAFF" },
  update: { passwordHash, name, role: role as "SUPER_ADMIN" | "ADMIN" | "STAFF" },
});

console.log(`Admin user ready: ${admin.email} (${admin.role})`);
await prisma.$disconnect();
