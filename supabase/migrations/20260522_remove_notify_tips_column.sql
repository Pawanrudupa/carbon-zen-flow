-- Migration: Remove notify_tips column from profiles table
-- Created at: 2026-05-21

ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS notify_tips;
