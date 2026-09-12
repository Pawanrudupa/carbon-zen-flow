-- Migration: Add theme_color and density to profiles table
-- Created at: 2026-09-12

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'green',
  ADD COLUMN IF NOT EXISTS density text DEFAULT 'comfortable';
