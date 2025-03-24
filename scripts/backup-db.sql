-- Backup script for PerchMerch database
-- Run this before resetting the database

-- Create backup tables
CREATE TABLE IF NOT EXISTS backup_users AS SELECT * FROM "User";
CREATE TABLE IF NOT EXISTS backup_brands AS SELECT * FROM "Brand";
CREATE TABLE IF NOT EXISTS backup_products AS SELECT * FROM "Product";
CREATE TABLE IF NOT EXISTS backup_orders AS SELECT * FROM "Order";
CREATE TABLE IF NOT EXISTS backup_affiliates AS SELECT * FROM "Affiliate";
CREATE TABLE IF NOT EXISTS backup_payouts AS SELECT * FROM "Payout";
CREATE TABLE IF NOT EXISTS backup_user_activities AS SELECT * FROM "UserActivity";
CREATE TABLE IF NOT EXISTS backup_analytics AS SELECT * FROM "Analytics";
CREATE TABLE IF NOT EXISTS backup_genres AS SELECT * FROM "Genre";
CREATE TABLE IF NOT EXISTS backup_platform_referral_links AS SELECT * FROM "PlatformReferralLink";
CREATE TABLE IF NOT EXISTS backup_platform_referrals AS SELECT * FROM "PlatformReferral";
CREATE TABLE IF NOT EXISTS backup_payment_methods AS SELECT * FROM "PaymentMethod";
CREATE TABLE IF NOT EXISTS backup_reports AS SELECT * FROM "Report";
CREATE TABLE IF NOT EXISTS backup_brand_access AS SELECT * FROM "BrandAccess"; 