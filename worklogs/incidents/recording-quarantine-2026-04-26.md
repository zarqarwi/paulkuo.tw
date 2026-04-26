# Recording / Internal-Sources Quarantine — 2026-04-26
## Reconnaissance findings (deviation from original handoff)
Original handoff (`worklogs/handoffs/code--wiki-recording-quarantine-incident-2026-04-26.md`) assumed 44 recording notes had `visibility: public` and were exposed externally. Reconnaissance found:
- All 44 raw_note_ids have always been `visibility: internal` since their first commit (45d3d47, 2026-04-05). `git log -p --all` shows zero `+visibility: public` history for the set.
- Schema (`src/content.config.ts:64`) only allows `'public' | 'internal'`. No `private` value exists.
- Frontend (`src/pages/wiki/[slug].astro:29`) filters source rendering with `visibility === 'public'`. Internal sources never rendered to HTML.
- KV seed (`scripts/wiki-kv-seed.cjs`) only seeds `concepts/`, not `sources/`.
Therefore the original `public → private` step was inapplicable and would have broken the build (`private` fails Zod schema). Paul approved decision **C**: extend audit to all 65 internal sources without changing visibility.

## Action taken
- Added `quarantine` block to all 65 sources with `visibility: internal` (audit trail).
- `visibility` field UNCHANGED (already correctly internal).
- recording_set_44: 0 files
- extended_audit_21: 0 files
- already quarantined (idempotent re-run): 65
- schema collisions (manual review needed): 0

## Scanner bug root cause
`scripts/build_wiki_ingest_report.py` `has_recording_tag()` matched only the literal `"录音卡笔记"`, missing the `"录音笔记"` (75 cases) and `"录音测试"` (1 case) variants in the get_筆記 source. Fixed in commit b0931a4 (contains-`"录音"`). The bug caused these notes to appear in the candidate ingest report, but the ingest pipeline's downstream visibility logic still labelled them `internal`, so there was no external exposure.

## recording_set_44 (handoff list)

## extended_audit_21 (Paul decision C)

## Already quarantined (skipped)
- `getnote-006336-stem-cell-exosome-automation.md`
- `getnote-008840-sdt-self-determination.md`
- `getnote-009912-future-survival-advice.md`
- `getnote-035296-absolute-zero-training.md`
- `getnote-043024-secondhand-recycling-logistics.md`
- `getnote-048304-care-butler-ai-longterm-care.md`
- `getnote-066168-ai-drug-discovery.md`
- `getnote-107776-midlife-growth-social-health.md`
- `getnote-123160-cervical-cancer-medical-data.md`
- `getnote-161424-sprouting-report.md`
- `getnote-161976-ai-timeline-prediction.md`
- `getnote-171424-supply-side-positive-sum.md`
- `getnote-171536-intelligence-vs-wisdom.md`
- `getnote-174608-employee-health-longterm-care.md`
- `getnote-178104-medical-aesthetics-overseas.md`
- `getnote-187800-value-monetization.md`
- `getnote-188584-pastor-pang-memorial.md`
- `getnote-216736-spear-grass-growth-law.md`
- `getnote-216800-sales-closing-techniques.md`
- `getnote-221528-uncertainty-as-meaning-fuel.md`
- `getnote-221560-japan-regenerative-medicine.md`
- `getnote-268104-vibe-coding-trend.md`
- `getnote-270152-tech-sports-platform-collab.md`
- `getnote-315912-hinton-ai-deception.md`
- `getnote-379840-silent-mode-wisdom.md`
- `getnote-384168-circular-economy-recycling-models.md`
- `getnote-389584-ai-predictions.md`
- `getnote-406952-personal-website-ai-tools.md`
- `getnote-435960-ai-hr-manufacturing.md`
- `getnote-454304-ai-1percent-talent.md`
- `getnote-458136-holographic-universe-theory.md`
- `getnote-479752-taiwan-environmental-projects.md`
- `getnote-482512-organizer-lecture-business.md`
- `getnote-498792-claude-skills-guide.md`
- `getnote-504720-neuroplasticity.md`
- `getnote-519528-enterprise-communication.md`
- `getnote-558096-alien-life-civilization.md`
- `getnote-566200-100year-life.md`
- `getnote-580464-growth-through-adversity.md`
- `getnote-584104-life-energy-management.md`
- `getnote-593912-human-nature-truths.md`
- `getnote-630888-recording-self-growth.md`
- `getnote-661768-business-project-meeting.md`
- `getnote-699320-tech-progress-paradox.md`
- `getnote-705576-rockwool-recycling.md`
- `getnote-714464-resource-collaboration.md`
- `getnote-749536-partnership-project-planning.md`
- `getnote-756056-pastor-pang-reflection.md`
- `getnote-780904-lab-facility-animal-research.md`
- `getnote-782928-preventive-medicine-ai-drug.md`
- `getnote-799912-three-decision-formulas.md`
- `getnote-808040-ai-medical-collaboration.md`
- `getnote-838824-circular-economy-decluttering.md`
- `getnote-842472-fortune-telling-psychology.md`
- `getnote-847528-system-design-lessons.md`
- `getnote-850688-overcoming-fear-breakthrough.md`
- `getnote-859688-munger-wealth-structure.md`
- `getnote-866496-environmental-innovation-npo.md`
- `getnote-874728-heavy-tail-extreme-values.md`
- `getnote-888480-compound-interest-capital.md`
- `getnote-896520-political-trust-collapse.md`
- `getnote-898432-ai-drug-design-biotech.md`
- `getnote-910880-emotional-self-awareness.md`
- `getnote-912296-growth-strategy-tool-person.md`
- `getnote-963240-material-substitution-fire.md`

## Phase 2 — manual review (Cowork)
Each quarantined file's `quarantine.review_outcome` must be set to one of:
- `restore_public`: public talk transcripts (Musk, Hinton, Munger, etc.) — flip visibility to `public`.
- `keep_internal`: personal reflections / business meetings — leave `visibility: internal`, mark review done.
- `delete`: highly sensitive (company names, partner financial terms) — remove file, add raw_note_id to a re-ingest blocklist.
- `redact_and_restore`: de-identify and flip to `public`.
Until phase-2 completes, `needs_review: true` stays.
