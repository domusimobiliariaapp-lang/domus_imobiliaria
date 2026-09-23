-- Migration: Add videos column to properties table

ALTER TABLE properties ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';
