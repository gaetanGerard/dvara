-- CreateTable
CREATE TABLE "Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "homeDashboard" INTEGER,
    CONSTRAINT "GroupSetting_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GroupSetting" ("groupId", "homeDashboard", "id") SELECT "groupId", "homeDashboard", "id" FROM "GroupSetting";
DROP TABLE "GroupSetting";
ALTER TABLE "new_GroupSetting" RENAME TO "GroupSetting";
CREATE UNIQUE INDEX "GroupSetting_groupId_key" ON "GroupSetting"("groupId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
