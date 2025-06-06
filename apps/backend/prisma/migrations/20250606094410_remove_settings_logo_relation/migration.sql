/*
  Warnings:

  - You are about to drop the column `logoMediaId` on the `Settings` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "main_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL
);
INSERT INTO "new_Settings" ("id", "main_color", "secondary_color", "theme", "title") SELECT "id", "main_color", "secondary_color", "theme", "title" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
