-- Migration: Add missing co2_saved and xp_earned columns to user_challenges table
-- Created at: 2026-05-21

ALTER TABLE public.user_challenges 
  ADD COLUMN IF NOT EXISTS co2_saved numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_earned integer DEFAULT 0;
