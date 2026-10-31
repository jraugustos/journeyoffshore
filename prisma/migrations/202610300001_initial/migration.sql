CREATE TABLE "Workspace" ("id" TEXT PRIMARY KEY, "session" JSONB NOT NULL, "metadata" JSONB NOT NULL, "revision" INTEGER NOT NULL DEFAULT 0, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "MacroProcess" ("id" TEXT PRIMARY KEY, "workspaceId" TEXT NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE, "name" TEXT NOT NULL, "short" TEXT NOT NULL, "status" TEXT NOT NULL, "position" INTEGER NOT NULL, "ownerIds" TEXT[] NOT NULL, "metadata" JSONB NOT NULL);
CREATE TABLE "WorkFront" ("id" TEXT PRIMARY KEY, "workspaceId" TEXT NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE, "macroId" TEXT NOT NULL REFERENCES "MacroProcess"("id") ON DELETE RESTRICT, "name" TEXT NOT NULL, "position" INTEGER NOT NULL, "payload" JSONB NOT NULL);
CREATE TABLE "AccessSession" ("tokenHash" TEXT PRIMARY KEY, "configVersion" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "LoginAttempt" ("key" TEXT PRIMARY KEY, "failures" INTEGER NOT NULL DEFAULT 0, "windowStart" TIMESTAMP(3) NOT NULL, "blockedUntil" TIMESTAMP(3));
CREATE INDEX "MacroProcess_workspaceId_position_idx" ON "MacroProcess"("workspaceId", "position");
CREATE INDEX "WorkFront_workspaceId_position_idx" ON "WorkFront"("workspaceId", "position");
CREATE INDEX "WorkFront_macroId_idx" ON "WorkFront"("macroId");
CREATE INDEX "AccessSession_expiresAt_idx" ON "AccessSession"("expiresAt");
