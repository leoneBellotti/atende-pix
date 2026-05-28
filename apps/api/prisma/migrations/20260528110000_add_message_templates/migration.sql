-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_tenantId_name_key" ON "MessageTemplate"("tenantId", "name");

-- CreateIndex
CREATE INDEX "MessageTemplate_tenantId_idx" ON "MessageTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "MessageTemplate_tenantId_active_idx" ON "MessageTemplate"("tenantId", "active");

-- AddForeignKey
ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
