/**
 * The six-stage production chain. This sequence is the product - the UI,
 * database, and n8n workflows all key off these step numbers.
 */

export type WorkflowStep = {
  step: number;
  id: string;
  workflow: string;
  title: string;
  customerLabel: string;
  /**
   * Path appended to N8N_BASE_URL/webhook/. WF-06 is registered under a
   * prefixed slug by n8n; keep it verbatim unless WF-06 is reimported.
   */
  webhookPath: string;
  resultKey: string;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    id: 'ingestion',
    workflow: 'WF-03',
    title: 'Product Image Ingestion',
    customerLabel: 'Reading your product photo',
    webhookPath: 'product-ingest',
    resultKey: 'product_analysis',
  },
  {
    step: 2,
    id: 'research',
    workflow: 'WF-04',
    title: 'Market and Content Research',
    customerLabel: 'Studying your market',
    webhookPath: 'market-research',
    resultKey: 'market_research',
  },
  {
    step: 3,
    id: 'copy',
    workflow: 'WF-05',
    title: 'Copy Matching Engine',
    customerLabel: 'Writing your sales copy',
    webhookPath: 'copy-match',
    resultKey: 'copy_data',
  },
  {
    step: 4,
    id: 'images',
    workflow: 'WF-06',
    title: 'Image Generation',
    customerLabel: 'Creating your product visuals',
    // Registered by n8n under this exact slug - see the manual, section 9.
    webhookPath: 'cAO50daJszSqaem6/webhookimagegen/image-generate',
    resultKey: 'image_urls',
  },
  {
    step: 5,
    id: 'video',
    workflow: 'WF-07',
    title: 'Video Generation',
    customerLabel: 'Filming your cinematic promo',
    webhookPath: 'video-generate',
    resultKey: 'video_url',
  },
  {
    step: 6,
    id: 'export',
    workflow: 'WF-08',
    title: 'Launch Kit Export',
    customerLabel: 'Packing your launch kit',
    webhookPath: 'launch-export',
    resultKey: 'launch_kit',
  },
];

export const JOB_STATUSES = [
  'uploaded',
  'ingestion_complete',
  'research_complete',
  'copy_complete',
  'video_complete',
  'composition_complete',
  'export_ready',
  'failed',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/** Status a job moves to once the given step succeeds. */
export const STATUS_AFTER_STEP: Record<number, JobStatus> = {
  1: 'ingestion_complete',
  2: 'research_complete',
  3: 'copy_complete',
  4: 'copy_complete',
  5: 'video_complete',
  6: 'export_ready',
};

export function stepByNumber(step: number): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find((s) => s.step === step);
}
