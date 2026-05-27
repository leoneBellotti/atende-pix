-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "publicToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_publicToken_key" ON "Payment"("publicToken");
