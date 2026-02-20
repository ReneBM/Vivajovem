-- Add status_relacionamento column to jovens table
ALTER TABLE public.jovens 
ADD COLUMN status_relacionamento text DEFAULT 'SOLTEIRO';

-- Update the check to allow valid relationship statuses
-- Values: SOLTEIRO, ORANDO, NAMORANDO, NOIVO, CASADO