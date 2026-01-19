-- Create enum for yield curve tenors
CREATE TYPE "yield_tenor" AS ENUM (
  'M1',
  'M3',
  'M6',
  'Y1',
  'Y2',
  'Y3',
  'Y5',
  'Y7',
  'Y10',
  'Y20',
  'Y30'
);

-- Normalize existing tenor strings before changing type
UPDATE "yield_curves"
SET "tenor" = CASE
  WHEN "tenor" IN ('1M', 'M1') THEN 'M1'
  WHEN "tenor" IN ('3M', 'M3') THEN 'M3'
  WHEN "tenor" IN ('6M', 'M6') THEN 'M6'
  WHEN "tenor" IN ('1Y', 'Y1') THEN 'Y1'
  WHEN "tenor" IN ('2Y', 'Y2') THEN 'Y2'
  WHEN "tenor" IN ('3Y', 'Y3') THEN 'Y3'
  WHEN "tenor" IN ('5Y', 'Y5') THEN 'Y5'
  WHEN "tenor" IN ('7Y', 'Y7') THEN 'Y7'
  WHEN "tenor" IN ('10Y', 'Y10') THEN 'Y10'
  WHEN "tenor" IN ('20Y', 'Y20') THEN 'Y20'
  WHEN "tenor" IN ('30Y', 'Y30') THEN 'Y30'
  ELSE "tenor"
END;

-- Convert column to enum type
ALTER TABLE "yield_curves"
ALTER COLUMN "tenor" TYPE "yield_tenor"
USING "tenor"::"yield_tenor";
