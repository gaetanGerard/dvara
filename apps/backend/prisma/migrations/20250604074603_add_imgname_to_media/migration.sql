/*
  Warnings:

  - Added the required column `imgName` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imgName" TEXT,
    "alt" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Media" ("alt", "createdAt", "id", "name", "updatedAt", "url", "imgName")
SELECT "alt", "createdAt", "id", "name", "updatedAt", "url", 'legacy_' || "id" FROM "Media";
DROP TABLE "Media";
ALTER TABLE "new_Media" RENAME TO "Media";
-- Rendre imgName NOT NULL et UNIQUE
CREATE UNIQUE INDEX "Media_imgName_key" ON "Media"("imgName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
