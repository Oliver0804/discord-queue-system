-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "speakTime" INTEGER NOT NULL,
    "hostCode" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preparing',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "extendedTime" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Queue_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_hostCode_key" ON "Event"("hostCode");

-- CreateIndex
CREATE UNIQUE INDEX "Event_shareCode_key" ON "Event"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "Queue_eventId_position_key" ON "Queue"("eventId", "position");
