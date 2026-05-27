-- SMS consent tracking on Person
ALTER TABLE "Person" ADD COLUMN "smsOptedOut" BOOLEAN NOT NULL DEFAULT false;
