/*
  Warnings:

  - You are about to drop the column `category` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `icon` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Application` table. All the data in the column will be lost.
  - Added the required column `iconMediaId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "DashboardContentApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" TEXT,
    "layoutData" TEXT,
    CONSTRAINT "DashboardContentApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DashboardContentApplication_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardContentCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" TEXT,
    "layoutData" TEXT,
    CONSTRAINT "DashboardContentCategory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardContentElement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER,
    "size" TEXT,
    "contentId" INTEGER,
    "position" TEXT,
    "layoutData" TEXT,
    CONSTRAINT "DashboardContentElement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DashboardContentApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DashboardContentElement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardContent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "DashboardContentSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" TEXT,
    "layoutData" TEXT,
    CONSTRAINT "DashboardContentSection_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dashboard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" INTEGER NOT NULL,
    "settingsId" INTEGER NOT NULL,
    "contentId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dashboard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dashboard_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "DashboardSettings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dashboard_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardSettingsAccessGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "permission" TEXT NOT NULL,
    "accessId" INTEGER NOT NULL,
    CONSTRAINT "DashboardSettingsAccessGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DashboardSettingsAccessGroup_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "DashboardSettingsAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardSettingsAccess" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "DashboardSettingsAccessUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "permission" TEXT NOT NULL,
    "accessId" INTEGER NOT NULL,
    CONSTRAINT "DashboardSettingsAccessUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DashboardSettingsAccessUser_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "DashboardSettingsAccess" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardSettingsAppearance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mainColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "transparent" REAL NOT NULL DEFAULT 1,
    "iconColor" TEXT NOT NULL,
    "borderRadius" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DashboardSettingsBackground" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mediaId" INTEGER,
    "position" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "repeat" TEXT NOT NULL,
    CONSTRAINT "DashboardSettingsBackground_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardSettingsGeneral" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pageTitle" TEXT NOT NULL,
    "metaTitle" TEXT,
    "logoMediaId" INTEGER,
    "faviconMediaId" INTEGER,
    CONSTRAINT "DashboardSettingsGeneral_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DashboardSettingsGeneral_faviconMediaId_fkey" FOREIGN KEY ("faviconMediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardSettingsLayout" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "layouts" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "DashboardSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generalId" INTEGER NOT NULL,
    "layoutId" INTEGER NOT NULL,
    "backgroundId" INTEGER NOT NULL,
    "appearanceId" INTEGER NOT NULL,
    "customCss" TEXT,
    "accessId" INTEGER,
    CONSTRAINT "DashboardSettings_generalId_fkey" FOREIGN KEY ("generalId") REFERENCES "DashboardSettingsGeneral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DashboardSettings_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "DashboardSettingsLayout" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DashboardSettings_backgroundId_fkey" FOREIGN KEY ("backgroundId") REFERENCES "DashboardSettingsBackground" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DashboardSettings_appearanceId_fkey" FOREIGN KEY ("appearanceId") REFERENCES "DashboardSettingsAppearance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DashboardSettings_accessId_fkey" FOREIGN KEY ("accessId") REFERENCES "DashboardSettingsAccess" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ElementCalendar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "elementId" INTEGER NOT NULL,
    CONSTRAINT "ElementCalendar_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "DashboardContentElement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ElementDateAndTime" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customCityName" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "format" BOOLEAN NOT NULL,
    "displaySeconds" BOOLEAN NOT NULL,
    "fixedTimeZone" BOOLEAN NOT NULL DEFAULT false,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Brussels',
    "displayDate" BOOLEAN NOT NULL DEFAULT true,
    "dateFormat" TEXT,
    "elementId" INTEGER NOT NULL,
    CONSTRAINT "ElementDateAndTime_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "DashboardContentElement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ElementNotepad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "elementId" INTEGER NOT NULL,
    CONSTRAINT "ElementNotepad_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "DashboardContentElement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CategoryApplications" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CategoryApplications_A_fkey" FOREIGN KEY ("A") REFERENCES "DashboardContentApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryApplications_B_fkey" FOREIGN KEY ("B") REFERENCES "DashboardContentCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "iconMediaId" INTEGER NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "displayPingUrl" BOOLEAN NOT NULL DEFAULT false,
    "pingUrl" TEXT,
    CONSTRAINT "Application_iconMediaId_fkey" FOREIGN KEY ("iconMediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("description", "id", "name", "url") SELECT "description", "id", "name", "url" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Dashboard_settingsId_key" ON "Dashboard"("settingsId");

-- CreateIndex
CREATE UNIQUE INDEX "Dashboard_contentId_key" ON "Dashboard"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSettings_generalId_key" ON "DashboardSettings"("generalId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSettings_layoutId_key" ON "DashboardSettings"("layoutId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSettings_backgroundId_key" ON "DashboardSettings"("backgroundId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSettings_appearanceId_key" ON "DashboardSettings"("appearanceId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardSettings_accessId_key" ON "DashboardSettings"("accessId");

-- CreateIndex
CREATE UNIQUE INDEX "ElementCalendar_elementId_key" ON "ElementCalendar"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "ElementDateAndTime_elementId_key" ON "ElementDateAndTime"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "ElementNotepad_elementId_key" ON "ElementNotepad"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryApplications_AB_unique" ON "_CategoryApplications"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryApplications_B_index" ON "_CategoryApplications"("B");
