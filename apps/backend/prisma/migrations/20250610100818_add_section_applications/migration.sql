-- CreateTable
CREATE TABLE "_SectionApplications" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SectionApplications_A_fkey" FOREIGN KEY ("A") REFERENCES "DashboardContentApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SectionApplications_B_fkey" FOREIGN KEY ("B") REFERENCES "DashboardContentSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_SectionApplications_AB_unique" ON "_SectionApplications"("A", "B");

-- CreateIndex
CREATE INDEX "_SectionApplications_B_index" ON "_SectionApplications"("B");
