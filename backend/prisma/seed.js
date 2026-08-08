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
                role: "HEADOFOPS"
            },
            {
                email: "user@test.com",
                password: hashedPMPassword,
                fullName: "PM User",
                role: "PROJECTMANAGER"
            }
        ],
        skipDuplicates: true
    });

    console.log("✅ Seeded successfully");
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });