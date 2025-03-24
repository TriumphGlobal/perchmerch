-- Reset script for PerchMerch database
-- Run this after backing up your data

-- Drop all tables in the correct order to handle dependencies
DROP TABLE IF EXISTS "Report" CASCADE;
DROP TABLE IF EXISTS "PaymentMethod" CASCADE;
DROP TABLE IF EXISTS "PlatformReferral" CASCADE;
DROP TABLE IF EXISTS "PlatformReferralLink" CASCADE;
DROP TABLE IF EXISTS "Analytics" CASCADE;
DROP TABLE IF EXISTS "UserActivity" CASCADE;
DROP TABLE IF EXISTS "Payout" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "Affiliate" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "BrandAccess" CASCADE;
DROP TABLE IF EXISTS "Brand" CASCADE;
DROP TABLE IF EXISTS "Genre" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop all backup tables
DROP TABLE IF EXISTS backup_users CASCADE;
DROP TABLE IF EXISTS backup_brands CASCADE;
DROP TABLE IF EXISTS backup_products CASCADE;
DROP TABLE IF EXISTS backup_orders CASCADE;
DROP TABLE IF EXISTS backup_affiliates CASCADE;
DROP TABLE IF EXISTS backup_payouts CASCADE;
DROP TABLE IF EXISTS backup_user_activities CASCADE;
DROP TABLE IF EXISTS backup_analytics CASCADE;
DROP TABLE IF EXISTS backup_genres CASCADE;
DROP TABLE IF EXISTS backup_platform_referral_links CASCADE;
DROP TABLE IF EXISTS backup_platform_referrals CASCADE;
DROP TABLE IF EXISTS backup_payment_methods CASCADE;
DROP TABLE IF EXISTS backup_reports CASCADE;
DROP TABLE IF EXISTS backup_brand_access CASCADE; 