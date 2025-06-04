/*
  Warnings:

  - Made the column `imgName` on table `Media` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imgName" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Media" ("alt", "createdAt", "id", "imgName", "name", "updatedAt", "url") SELECT "alt", "createdAt", "id", "imgName", "name", "updatedAt", "url" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
CREATE UNIQUE INDEX "Media_imgName_key" ON "Media"("imgName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
