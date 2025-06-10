-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DashboardContentApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" TEXT,
    "layoutData" TEXT,
    CONSTRAINT "DashboardContentApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DashboardContentApplication_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DashboardContentApplication" ("applicationId", "contentId", "id", "layoutData", "order", "position", "size") SELECT "applicationId", "contentId", "id", "layoutData", "order", "position", "size" FROM "DashboardContentApplication";
DROP TABLE "DashboardContentApplication";
ALTER TABLE "new_DashboardContentApplication" RENAME TO "DashboardContentApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
