/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "firstDayOfWeek" TEXT NOT NULL DEFAULT 'MONDAY',
    "group" TEXT NOT NULL DEFAULT 'EVERYONE',
    "homeDashboard" INTEGER,
    "refreshToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "firstDayOfWeek", "homeDashboard", "id", "image", "language", "name", "password", "refreshToken", "updatedAt") SELECT "createdAt", "email", "firstDayOfWeek", "homeDashboard", "id", "image", "language", "name", "password", "refreshToken", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
