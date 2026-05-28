-- AlterTable
ALTER TABLE "Message" ADD COLUMN "status" TEXT,
ADD COLUMN "statusAt" TIMESTAMP(3),
ADD COLUMN "failureReason" TEXT;
