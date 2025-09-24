-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebhookLog_webhookId_key" ON "WebhookLog"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookLog_webhookId_idx" ON "WebhookLog"("webhookId");
