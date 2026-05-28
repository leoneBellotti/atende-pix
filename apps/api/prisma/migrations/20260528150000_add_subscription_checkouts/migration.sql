ALTER TABLE "Subscription"
ADD COLUMN "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3),
ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "paymentProvider" TEXT,
ADD COLUMN "paymentMethod" TEXT,
ADD COLUMN "externalSubscriptionId" TEXT;

UPDATE "Subscription"
SET
  "currentPeriodStart" = "startedAt",
  "currentPeriodEnd" = COALESCE("renewsAt", "startedAt" + INTERVAL '30 days'),
  "renewsAt" = COALESCE("renewsAt", "startedAt" + INTERVAL '30 days')
WHERE "currentPeriodStart" IS NULL;

CREATE TABLE "SubscriptionCheckout" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "provider" TEXT NOT NULL DEFAULT 'LOCAL',
  "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "publicToken" TEXT NOT NULL,
  "checkoutUrl" TEXT,
  "paidAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SubscriptionCheckout_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubscriptionCheckout_publicToken_key" ON "SubscriptionCheckout"("publicToken");
CREATE INDEX "SubscriptionCheckout_tenantId_idx" ON "SubscriptionCheckout"("tenantId");
CREATE INDEX "SubscriptionCheckout_planId_idx" ON "SubscriptionCheckout"("planId");
CREATE INDEX "SubscriptionCheckout_status_idx" ON "SubscriptionCheckout"("status");

ALTER TABLE "SubscriptionCheckout"
ADD CONSTRAINT "SubscriptionCheckout_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCheckout"
ADD CONSTRAINT "SubscriptionCheckout_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
