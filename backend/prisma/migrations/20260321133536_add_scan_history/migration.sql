-- CreateTable
CREATE TABLE "ScanHistory" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "findingsCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "commitSha" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'manual',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanHistory_pkey" PRIMARY KEY ("id")
);
