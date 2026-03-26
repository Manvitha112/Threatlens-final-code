-- AlterTable
ALTER TABLE "Repo" ADD COLUMN     "contributors" TEXT,
ADD COLUMN     "dependencies" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fileCount" INTEGER,
ADD COLUMN     "forks" INTEGER,
ADD COLUMN     "languages" TEXT,
ADD COLUMN     "readmeSummary" TEXT,
ADD COLUMN     "recentCommits" TEXT,
ADD COLUMN     "repoSize" INTEGER,
ADD COLUMN     "stars" INTEGER;
