-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "iconMediaId" INTEGER,
    "description" TEXT,
    "url" TEXT,
    "displayPingUrl" BOOLEAN NOT NULL DEFAULT false,
    "pingUrl" TEXT,
    CONSTRAINT "Application_iconMediaId_fkey" FOREIGN KEY ("iconMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("description", "displayPingUrl", "iconMediaId", "id", "name", "pingUrl", "url") SELECT "description", "displayPingUrl", "iconMediaId", "id", "name", "pingUrl", "url" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
