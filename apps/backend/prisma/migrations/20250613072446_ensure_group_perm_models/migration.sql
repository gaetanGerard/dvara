-- CreateTable
CREATE TABLE "GroupPerm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canAdd" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canUse" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GroupPermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dashPermId" INTEGER,
    "appsPermId" INTEGER,
    "mediaPermId" INTEGER,
    "groupPermId" INTEGER,
    CONSTRAINT "GroupPermission_dashPermId_fkey" FOREIGN KEY ("dashPermId") REFERENCES "DashPerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupPermission_appsPermId_fkey" FOREIGN KEY ("appsPermId") REFERENCES "AppsPerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupPermission_mediaPermId_fkey" FOREIGN KEY ("mediaPermId") REFERENCES "MediaPerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupPermission_groupPermId_fkey" FOREIGN KEY ("groupPermId") REFERENCES "GroupPerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GroupPermission" ("appsPermId", "dashPermId", "description", "id", "mediaPermId", "name") SELECT "appsPermId", "dashPermId", "description", "id", "mediaPermId", "name" FROM "GroupPermission";
DROP TABLE "GroupPermission";
ALTER TABLE "new_GroupPermission" RENAME TO "GroupPermission";
CREATE UNIQUE INDEX "GroupPermission_name_key" ON "GroupPermission"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GroupPerm_name_key" ON "GroupPerm"("name");
