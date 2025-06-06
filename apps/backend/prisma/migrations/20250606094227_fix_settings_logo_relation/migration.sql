/*
  Warnings:

  - Added the required column `logoMediaId` to the `Settings` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "main_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "logoMediaId" INTEGER NOT NULL,
    CONSTRAINT "Settings_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("id", "main_color", "secondary_color", "theme", "title") SELECT "id", "main_color", "secondary_color", "theme", "title" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
