/*
  Warnings:

  - You are about to drop the column `applicationId` on the `DashboardContentElement` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DashboardContentElement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "size" TEXT,
    "contentId" INTEGER,
    "position" TEXT,
    "layoutData" TEXT,
    "type" TEXT,
    "data" JSONB,
    CONSTRAINT "DashboardContentElement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DashboardContentElement" ("contentId", "data", "id", "layoutData", "position", "size", "type") SELECT "contentId", "data", "id", "layoutData", "position", "size", "type" FROM "DashboardContentElement";
DROP TABLE "DashboardContentElement";
ALTER TABLE "new_DashboardContentElement" RENAME TO "DashboardContentElement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
