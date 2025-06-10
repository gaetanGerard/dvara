/*
  Warnings:

  - You are about to alter the column `layoutData` on the `DashboardContentApplication` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `layoutData` on the `DashboardContentCategory` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `layoutData` on the `DashboardContentElement` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `layoutData` on the `DashboardContentSection` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DashboardContentApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" JSONB,
    "layoutData" JSONB,
    CONSTRAINT "DashboardContentApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DashboardContentApplication_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DashboardContentApplication" ("applicationId", "contentId", "id", "layoutData", "order", "position", "size") SELECT "applicationId", "contentId", "id", "layoutData", "order", "position", "size" FROM "DashboardContentApplication";
DROP TABLE "DashboardContentApplication";
ALTER TABLE "new_DashboardContentApplication" RENAME TO "DashboardContentApplication";
CREATE TABLE "new_DashboardContentCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" JSONB,
    "layoutData" JSONB,
    CONSTRAINT "DashboardContentCategory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DashboardContentCategory" ("contentId", "id", "layoutData", "name", "order", "position", "size") SELECT "contentId", "id", "layoutData", "name", "order", "position", "size" FROM "DashboardContentCategory";
DROP TABLE "DashboardContentCategory";
ALTER TABLE "new_DashboardContentCategory" RENAME TO "DashboardContentCategory";
CREATE TABLE "new_DashboardContentElement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "size" TEXT,
    "contentId" INTEGER,
    "position" JSONB,
    "layoutData" JSONB,
    "type" TEXT,
    "data" JSONB,
    CONSTRAINT "DashboardContentElement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DashboardContentElement" ("contentId", "data", "id", "layoutData", "position", "size", "type") SELECT "contentId", "data", "id", "layoutData", "position", "size", "type" FROM "DashboardContentElement";
DROP TABLE "DashboardContentElement";
ALTER TABLE "new_DashboardContentElement" RENAME TO "DashboardContentElement";
CREATE TABLE "new_DashboardContentSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" JSONB,
    "layoutData" JSONB,
    CONSTRAINT "DashboardContentSection_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DashboardContentSection" ("contentId", "id", "layoutData", "name", "order", "position", "size") SELECT "contentId", "id", "layoutData", "name", "order", "position", "size" FROM "DashboardContentSection";
DROP TABLE "DashboardContentSection";
ALTER TABLE "new_DashboardContentSection" RENAME TO "DashboardContentSection";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
