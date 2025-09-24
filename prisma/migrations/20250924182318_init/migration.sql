-- CreateEnum
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('PENDING', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'MISSED', 'VOICEMAIL');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organization" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "direction" "CallDirection" NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'PENDING',
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "recordingUrl" TEXT,
    "userId" TEXT,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'QUEUED',
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "userId" TEXT,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voicemail" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "transcription" TEXT,
    "audioUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voicemail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "matchType" TEXT NOT NULL,
    "matchValue" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionValue" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactGroupOnContact" (
    "contactId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "ContactGroupOnContact_pkey" PRIMARY KEY ("contactId","groupId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Call_userId_idx" ON "Call"("userId");

-- CreateIndex
CREATE INDEX "Call_contactId_idx" ON "Call"("contactId");

-- CreateIndex
CREATE INDEX "Call_fromNumber_idx" ON "Call"("fromNumber");

-- CreateIndex
CREATE INDEX "Call_toNumber_idx" ON "Call"("toNumber");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Message_contactId_idx" ON "Message"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "Voicemail_callId_key" ON "Voicemail"("callId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voicemail" ADD CONSTRAINT "Voicemail_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGroupOnContact" ADD CONSTRAINT "ContactGroupOnContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactGroupOnContact" ADD CONSTRAINT "ContactGroupOnContact_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ContactGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
