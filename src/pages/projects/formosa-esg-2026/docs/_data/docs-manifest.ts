export interface DocEntry {
  slug: string;
  titleKey: string;
  descKey: string;
  file: string;
  category: 'technical' | 'record';
}

export const docsManifest: DocEntry[] = [
  {
    slug: 'api',
    titleKey: 'docsPage.apiTitle',
    descKey: 'docsPage.apiDesc',
    file: 'api-endpoint-reference.md',
    category: 'technical',
  },
  {
    slug: 'data-model',
    titleKey: 'docsPage.dataModelTitle',
    descKey: 'docsPage.dataModelDesc',
    file: 'data-model-reference.md',
    category: 'technical',
  },
  {
    slug: 'operations',
    titleKey: 'docsPage.operationsTitle',
    descKey: 'docsPage.operationsDesc',
    file: 'operations-runbook.md',
    category: 'technical',
  },
  {
    slug: 'resilience',
    titleKey: 'docsPage.resilienceTitle',
    descKey: 'docsPage.resilienceDesc',
    file: 'resilience-engineering-record.md',
    category: 'technical',
  },
  {
    slug: 'smoke-test',
    titleKey: 'docsPage.smokeTestTitle',
    descKey: 'docsPage.smokeTestDesc',
    file: 'smoke-test-checklist.md',
    category: 'technical',
  },
  {
    slug: 'pitfalls',
    titleKey: 'docsPage.pitfallsTitle',
    descKey: 'docsPage.pitfallsDesc',
    file: 'known-pitfalls.md',
    category: 'technical',
  },
];
