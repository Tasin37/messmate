-- Better Auth Column Compatibility Fix

-- 1. Make snake_case columns nullable on session, account, verification so Better Auth inserts succeed
ALTER TABLE "session" ALTER COLUMN expires_at DROP NOT NULL;
ALTER TABLE "session" ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE "account" ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE "account" ALTER COLUMN provider_id DROP NOT NULL;
ALTER TABLE "account" ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE "verification" ALTER COLUMN expires_at DROP NOT NULL;

-- 2. Add camelCase columns on "user" table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Add camelCase columns on "session" table
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "user"(id) ON DELETE CASCADE;

-- 4. Add camelCase columns on "account" table
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "providerId" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "user"(id) ON DELETE CASCADE;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Add camelCase columns on "verification" table
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Sync existing records so data is consistent
UPDATE "user" SET "emailVerified" = COALESCE(email_verified, false), "createdAt" = COALESCE(created_at, NOW()), "updatedAt" = COALESCE(updated_at, NOW());
UPDATE "session" SET "expiresAt" = expires_at, "createdAt" = COALESCE(created_at, NOW()), "updatedAt" = COALESCE(created_at, NOW()), "userId" = user_id WHERE "expiresAt" IS NULL AND expires_at IS NOT NULL;
UPDATE "account" SET "accountId" = account_id, "providerId" = provider_id, "userId" = user_id WHERE "accountId" IS NULL AND account_id IS NOT NULL;
UPDATE "verification" SET "expiresAt" = expires_at, "createdAt" = COALESCE(created_at, NOW()), "updatedAt" = COALESCE(created_at, NOW()) WHERE "expiresAt" IS NULL AND expires_at IS NOT NULL;
