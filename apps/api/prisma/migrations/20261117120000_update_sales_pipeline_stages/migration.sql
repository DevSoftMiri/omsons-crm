-- Keep the existing stage IDs so all leads remain associated with their stages.
-- Rename the default Sales Pipeline stages to the requested workflow.
UPDATE "PipelineStage" AS stage
SET "name" = CASE stage."order"
  WHEN 0 THEN 'New'
  WHEN 1 THEN 'Presentation'
  WHEN 2 THEN 'Negotiation'
  WHEN 3 THEN 'Quotation Sent'
  WHEN 4 THEN 'Qualified'
  WHEN 5 THEN 'Unqualified'
  ELSE stage."name"
END
FROM "Pipeline" AS pipeline
WHERE stage."pipelineId" = pipeline."id"
  AND pipeline."name" = 'Sales Pipeline'
  AND stage."order" BETWEEN 0 AND 5;

-- Map the removed seventh stage (usually Closed Lost) to Unqualified first,
-- so no existing lead is lost when the old stage is removed.
UPDATE "Deal" AS deal
SET "stageId" = target."id",
    "stage" = target."name"
FROM "PipelineStage" AS old_stage
JOIN "Pipeline" AS pipeline ON pipeline."id" = old_stage."pipelineId"
JOIN "PipelineStage" AS target ON target."pipelineId" = pipeline."id" AND target."order" = 5
WHERE deal."stageId" = old_stage."id"
  AND pipeline."name" = 'Sales Pipeline'
  AND old_stage."order" > 5;

DELETE FROM "PipelineStage" AS stage
USING "Pipeline" AS pipeline
WHERE stage."pipelineId" = pipeline."id"
  AND pipeline."name" = 'Sales Pipeline'
  AND stage."order" > 5;
