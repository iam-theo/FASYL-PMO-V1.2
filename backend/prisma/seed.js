import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const hashedAdminPassword = await bcrypt.hash("123456", 10);
    const hashedPMPassword = await bcrypt.hash("654321", 10);

    await prisma.user.createMany({
        data: [
            {
                email: "admin@test.com",
                password: hashedAdminPassword,
                fullName: "Admin User",
                role: "HEADOFOPS",
                mustChangePassword: true
            },
            {
                email: "user@test.com",
                password: hashedPMPassword,
                fullName: "PM User",
                role: "PROJECTMANAGER",
                mustChangePassword: true
            }
        ],
        skipDuplicates: true
    });

    // Seeded/test credentials should always be forced to change on first
    // login, even when the rows already exist (e.g. created before the
    // mustChangePassword column existed).
    const updated = await prisma.user.updateMany({
        where: {
            email: {
                in: ["admin@test.com", "user@test.com", "coo@fasylng.com"],
            },
        },
        data: { mustChangePassword: true },
    });

    console.log(`✅ Seeded successfully (${updated.count} seeded accounts flagged for password change)`);
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });