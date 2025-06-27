/*
  Warnings:

  - You are about to drop the column `platform` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `senderName` on the `Message` table. All the data in the column will be lost.
  - Added the required column `pageId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Store" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "fbUserId" INTEGER,
    CONSTRAINT "Store_fbUserId_fkey" FOREIGN KEY ("fbUserId") REFERENCES "FbUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FbUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "facebookUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "pageAccessToken" TEXT NOT NULL,
    "fbUserId" INTEGER NOT NULL,
    CONSTRAINT "Page_fbUserId_fkey" FOREIGN KEY ("fbUserId") REFERENCES "FbUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Message" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pageId" INTEGER NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("content", "direction", "id", "senderId", "timestamp") SELECT "content", "direction", "id", "senderId", "timestamp" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Store_shopDomain_key" ON "Store"("shopDomain");

-- CreateIndex
CREATE UNIQUE INDEX "FbUser_facebookUserId_key" ON "FbUser"("facebookUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Page_pageId_key" ON "Page"("pageId");
