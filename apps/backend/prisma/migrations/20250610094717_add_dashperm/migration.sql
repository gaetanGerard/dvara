-- CreateTable
CREATE TABLE "Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "iconMediaId" INTEGER NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "displayPingUrl" BOOLEAN NOT NULL DEFAULT false,
    "pingUrl" TEXT,
    CONSTRAINT "Application_iconMediaId_fkey" FOREIGN KEY ("iconMediaId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppsPerm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canAdd" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canUse" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "DashPerm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canAdd" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canUse" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "DashboardContentApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" JSONB,
    "layoutData" TEXT,
    CONSTRAINT "DashboardContentApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DashboardContentApplication_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardContentCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "size" TEXT,
    "contentId" INTEGER,
    "position" JSONB,
    "layoutData" TEXT,
    CONSTRAINT "DashboardContentCategory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "DashboardContent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardContentElement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "size" TEXT,
    "contentId" INTEGER,
    "position" JSONB,
    "layoutData" TEXT,
    "type" TEXT,
    "data" JSONB,
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
    "position" JSONB,
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
CREATE TABLE "DayOfWeek" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL DEFAULT 'MONDAY'
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
CREATE TABLE "Group" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "system" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "GroupPermission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dashPermId" INTEGER,
    "appsPermId" INTEGER,
    "mediaPermId" INTEGER,
    CONSTRAINT "GroupPermission_dashPermId_fkey" FOREIGN KEY ("dashPermId") REFERENCES "DashPerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupPermission_appsPermId_fkey" FOREIGN KEY ("appsPermId") REFERENCES "AppsPerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GroupPermission_mediaPermId_fkey" FOREIGN KEY ("mediaPermId") REFERENCES "MediaPerm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupId" INTEGER NOT NULL,
    "homeDashboard" INTEGER,
    CONSTRAINT "GroupSetting_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Language" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "iso" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Media" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imgName" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaPerm" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canUpload" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canUse" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "main_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "description" TEXT,
    "logo_alt" TEXT NOT NULL,
    "logo_name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mediaId" INTEGER,
    "languageId" INTEGER,
    "dayOfWeekId" INTEGER,
    "homeDashboard" INTEGER,
    "refreshToken" TEXT,
    "resetPasswordRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_dayOfWeekId_fkey" FOREIGN KEY ("dayOfWeekId") REFERENCES "DayOfWeek" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CategoryApplications" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CategoryApplications_A_fkey" FOREIGN KEY ("A") REFERENCES "DashboardContentApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CategoryApplications_B_fkey" FOREIGN KEY ("B") REFERENCES "DashboardContentCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GroupAdmins" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_GroupAdmins_A_fkey" FOREIGN KEY ("A") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GroupAdmins_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GroupPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_GroupPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GroupPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "GroupPermission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_UserGroups" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_UserGroups_A_fkey" FOREIGN KEY ("A") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserGroups_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AppsPerm_name_key" ON "AppsPerm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DashPerm_name_key" ON "DashPerm"("name");

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
CREATE UNIQUE INDEX "DayOfWeek_name_key" ON "DayOfWeek"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ElementCalendar_elementId_key" ON "ElementCalendar"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "ElementDateAndTime_elementId_key" ON "ElementDateAndTime"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "ElementNotepad_elementId_key" ON "ElementNotepad"("elementId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_key" ON "Group"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPermission_name_key" ON "GroupPermission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GroupSetting_groupId_key" ON "GroupSetting"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Language_iso_key" ON "Language"("iso");

-- CreateIndex
CREATE UNIQUE INDEX "Media_imgName_key" ON "Media"("imgName");

-- CreateIndex
CREATE UNIQUE INDEX "MediaPerm_name_key" ON "MediaPerm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_pseudo_key" ON "User"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryApplications_AB_unique" ON "_CategoryApplications"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryApplications_B_index" ON "_CategoryApplications"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GroupAdmins_AB_unique" ON "_GroupAdmins"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupAdmins_B_index" ON "_GroupAdmins"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_GroupPermissions_AB_unique" ON "_GroupPermissions"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupPermissions_B_index" ON "_GroupPermissions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserGroups_AB_unique" ON "_UserGroups"("A", "B");

-- CreateIndex
CREATE INDEX "_UserGroups_B_index" ON "_UserGroups"("B");
