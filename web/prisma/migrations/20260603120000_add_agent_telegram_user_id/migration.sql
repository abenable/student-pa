ALTER TABLE "Agent" ADD COLUMN "telegramUserId" BIGINT;

CREATE UNIQUE INDEX "Agent_telegramUserId_key" ON "Agent"("telegramUserId");
