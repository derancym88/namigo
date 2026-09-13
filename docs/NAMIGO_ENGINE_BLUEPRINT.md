# NamiGo Engine Blueprint

Version: 2026-05-05
Source material: `NamiGo_AI_Content_Engine.pdf`, `Demystifying_NamiGo.mp4`

## Core Positioning

NamiGo is an AI e-commerce content production engine, not only a landing page or file upload app.

Promise:

- "Kami Urus... Kamu Rehat."
- One raw product input becomes a complete commercial launch kit.
- The system analyzes, decides, generates, composes, and prepares assets for download/publishing.

Market problem:

- TikTok, Shopee, and similar commerce channels require constant fresh visual content.
- Manual production is slow and expensive.
- SME sellers need high-frequency, cinematic, conversion-focused assets without running a studio.

## Core Engine Flow

The engine must follow this six-stage production chain.

1. Product Image Ingestion
2. Market and Content Research
3. Copy Matching Engine
4. Video Generation
5. Auto Composition
6. Export and Publish

This sequence is the product. The UI, database, n8n workflows, credits, and admin controls must all support this sequence.

## Stage 1: Product Image Ingestion

Input:

- Real, raw product image uploaded by the user.
- Product name and basic business context.

Engine behavior:

- Extract visible product facts only.
- Detect physical product details from the image.
- Flag missing specs instead of inventing facts.
- Establish the factual foundation for all later copy, image, and video generation.

Required structured output:

- Product type/category
- Visible color/material/shape
- Packaging clues
- Visible claims/text on pack
- Missing information list
- Confidence score
- Image quality notes

Important rule:

- The engine must not hallucinate specs. If something is not visible or provided by the user, flag it as missing.

## Stage 2: Market and Content Research

Input:

- Product category
- Product analysis from ingestion
- User Q&A brief
- Target platform and language

Engine behavior:

- Research category-specific TikTok/e-commerce trends.
- Identify viral hook formats.
- Analyze buyer objections.
- Determine the strongest call to action.

Required structured output:

- Trend angles
- Hook patterns
- Buyer objections
- Competitor positioning
- CTA recommendation
- Content risk notes
- Platform guidance for TikTok/Shopee/Lazada/WhatsApp

## Stage 3: Copy Matching Engine

Input:

- Visual product facts
- Market research
- Buyer objection map
- Brand tone
- Target languages

Engine behavior:

- Generate conversion text assets matched to the product and platform.
- Produce product title, bullet benefits, captions, offers, hooks, and scripts.
- Use visible facts and approved brief only.

Required structured output:

- Product title
- Short product description
- Benefit bullets
- TikTok captions
- Hook lines
- CTA lines
- Limited-time offer copy
- Shopee/Lazada listing copy
- WhatsApp sales reply copy
- Script lines for video

## Stage 4: Video Generation

Input:

- Product image
- Copy assets
- Research angles
- Chosen hook and CTA
- Language/script

Engine behavior:

- Generate 9:16 vertical product video assets.
- Use camera motion automation such as pan and zoom.
- Use beat-matched pacing.
- Integrate CTA copy.
- Output cinematic promotional video, usually 10-30 seconds depending on package.

Required structured output:

- Video prompt
- Shot list
- Scene timeline
- Camera motion plan
- CTA overlay text
- Voice/script text when applicable
- Generated video URL

## Stage 5: Auto Composition

Input:

- Generated images
- Generated video
- Copy assets
- Brand styling
- Package rules

Engine behavior:

- Merge generated elements into studio-grade final output.
- Generate real MP4 videos.
- Integrate generated lifestyle scenes.
- Apply premium gradient/background composition for brand consistency.

Required structured output:

- Final image set
- Final MP4
- Thumbnail/cover
- Export folder manifest
- Brand consistency checks

## Stage 6: Export and Publish

Input:

- Completed launch kit assets
- Customer/package permissions

Engine behavior:

- Present results in calm, non-technical language.
- Let user download or publish.
- Deliver a complete go-to-market bundle.

Launch kit contents:

- Analysis: market insight
- Copy: multilingual scripts and captions
- Images: 4K commercial product photos
- Video: cinematic promo
- Delivery: cloud export

## Multilingual Requirements

NamiGo must support English, Malay, and Chinese. The engine should include video script translation and cultural relevance checks for different demographics.

The language selector is not cosmetic. It must feed the copy and video script generation steps.

## Credit Economy

Base credit rule:

- 1 credit = RM5.00

Example consumption:

- Image recognition and analysis: 1 credit
- 4K commercial product images x4: 2 credits
- 10-second cinematic video: 2 credits

The app should track credits transparently and map each generated output to credit usage.

## Tier Logic

Tier capabilities from the deck:

- Trial: preview only
- Starter: images only
- Growth: images plus limited video
- Pro: full engine
- Agency: multi-client management

Current business packages:

- NamiGo X / Business Allocation Package: RM4,500, 120 standard launch kits, market insight and copywriting, 4 x 4K visuals, 10-second cinematic video, delivery within 24 hours.
- NamiGo Corp: RM8,500, 200 standard launch kits, dual language, 5 x 4K visuals, 15-second cinematic video, private asset cloud, organized SKU library.
- NamiGo Pro: RM15,000, 330 standard launch kits, 3 languages, 8 x 4K visuals, 25-30 second cinematic video, personalized brand engine, locked tone of voice, custom prompt calibration.

## Terms of Engagement

- Payment: 100% advance payment before credit activation.
- Validity: credits valid for 3 months and expire automatically if unused.
- Rights: generated outputs are for commercial usage upon full payment.
- Delivery: timeline subject to workload complexity.

## Implementation Requirements For The Web App

The app must not stop at passcode plus upload. It needs an intake and production console that matches the real engine.

Required customer intake:

- Product image upload
- Product name
- Brand name
- Category
- Target customer
- Product benefits
- Unique selling point
- Offer/promo
- Target platform
- Language
- Brand tone
- Competitors/references
- Missing specs/questions

Required job state:

- Uploaded
- Ingestion complete
- Research complete
- Copy complete
- Video generation complete
- Composition complete
- Export ready

Required job data objects:

- `product_analysis`
- `market_research`
- `copy_data`
- `image_urls`
- `video_url`
- `launch_kit`
- `export_manifest`

Required user experience:

- Calm guided interface
- Non-technical language
- Clear progress
- Simple download/publish result screen

## Implementation Requirements For n8n

n8n must not be treated as a generic webhook receiver. It is the production engine orchestration layer.

Each workflow must accept and return structured JSON.

Workflow payload should include:

- `job_id`
- `user_id`
- `tier`
- `credit_budget`
- `product_image_url`
- `intake_brief`
- `product_analysis`
- `market_research`
- `copy_data`
- `language`
- `platforms`
- `brand_rules`

Each step should write its result back to the app through `/api/n8n/webhook`.

## Current Gap In The Prototype

The current app now has passcode control, upload, Q&A intake, job creation, and demo workflow triggers.

To match the true NamiGo engine, the next implementation pass must add:

- Real stage-specific results display
- Real `product_analysis` output in Step 1
- Real market/category research output in Step 2
- Real copy asset generation in Step 3
- Real media provider calls for images/video
- Real launch kit export page
- Credit deduction per step
- Tier-specific capability locking
- Multi-language output controls
- Customer/SKU library for repeat production

