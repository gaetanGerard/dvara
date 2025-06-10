/*
  Warnings:

  - You are about to drop the `Application` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AppsPerm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashPerm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Dashboard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardContent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardContentApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardContentCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardContentElement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardContentSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettingsAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettingsAccessGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettingsAccessUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettingsAppearance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettingsBackground` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettingsGeneral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DashboardSettingsLayout` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DayOfWeek` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ElementCalendar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ElementDateAndTime` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ElementNotepad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupPermission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupSetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Language` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MediaPerm` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CategoryApplications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GroupAdmins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GroupPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserGroups` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Application";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AppsPerm";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashPerm";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Dashboard";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardContent";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardContentApplication";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardContentCategory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardContentElement";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardContentSection";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettingsAccess";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettingsAccessGroup";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettingsAccessUser";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettingsAppearance";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettingsBackground";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettingsGeneral";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DashboardSettingsLayout";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DayOfWeek";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ElementCalendar";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ElementDateAndTime";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ElementNotepad";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Group";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GroupPermission";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GroupSetting";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Language";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Media";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "MediaPerm";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Settings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CategoryApplications";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_GroupAdmins";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_GroupPermissions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_UserGroups";
PRAGMA foreign_keys=on;
