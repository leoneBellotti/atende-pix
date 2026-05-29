-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'DONE', 'CANCELED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "ProductService"
  ADD COLUMN "trackStock" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stockQuantity" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "lowStockThreshold" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "locationId" TEXT;

-- CreateTable
CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "locationId" TEXT,
  "orderId" TEXT,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "responsibleName" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCommission" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "salespersonName" TEXT NOT NULL,
  "rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "paid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SalesCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_tenantId_name_key" ON "Location"("tenantId", "name");
CREATE INDEX "Location_tenantId_idx" ON "Location"("tenantId");
CREATE INDEX "Location_tenantId_active_idx" ON "Location"("tenantId", "active");
CREATE INDEX "Appointment_tenantId_idx" ON "Appointment"("tenantId");
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");
CREATE INDEX "Appointment_locationId_idx" ON "Appointment"("locationId");
CREATE INDEX "Appointment_orderId_idx" ON "Appointment"("orderId");
CREATE INDEX "Appointment_tenantId_startsAt_idx" ON "Appointment"("tenantId", "startsAt");
CREATE INDEX "Appointment_tenantId_status_idx" ON "Appointment"("tenantId", "status");
CREATE INDEX "SalesCommission_tenantId_idx" ON "SalesCommission"("tenantId");
CREATE INDEX "SalesCommission_orderId_idx" ON "SalesCommission"("orderId");
CREATE INDEX "SalesCommission_tenantId_paid_idx" ON "SalesCommission"("tenantId", "paid");
CREATE INDEX "ProductService_tenantId_trackStock_idx" ON "ProductService"("tenantId", "trackStock");
CREATE INDEX "Order_locationId_idx" ON "Order"("locationId");

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalesCommission" ADD CONSTRAINT "SalesCommission_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
