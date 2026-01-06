export interface SEOCheckResult {
  score: number;
  weight: number;
  status: 'pass' | 'warn' | 'fail' | 'info';
  title: string;
  description: string;
  recommendation: string;
  details?: Record<string, any>;
  category: SEOCategory;
}

export interface SEOCategory {
  name: string;
  description: string;
  weight: number;
}

export interface SEOAuditConfig {
  categories: SEOCategory[];
  modules: string[];
  weights: Record<string, number>;
  thresholds: {
    excellent: number;
    good: number;
    needsImprovement: number;
    poor: number;
  };
  customRules?: CustomRule[];
}

export interface CustomRule {
  id: string;
  name: string;
  category: string;
  weight: number;
  check: (pageData: PageData) => SEOCheckResult;
}

export interface PageData {
  url: string;
  html: string;
  title: string;
  description: string;
  h1: string[];
  h2: string[];
  h3: string[];
  images: ImageData[];
  links: LinkData[];
  meta: MetaData;
  performance: PerformanceData;
  schema: SchemaData[];
  content: ContentData;
  custom?: Record<string, any>;
}

export interface ImageData {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  lazy?: boolean;
  optimized?: boolean;
}

export interface LinkData {
  href: string;
  text: string;
  rel?: string;
  internal: boolean;
  broken?: boolean;
}

export interface MetaData {
  canonical?: string;
  viewport?: string;
  robots?: string;
  author?: string;
  keywords?: string;
  og: Record<string, string>;
  twitter: Record<string, string>;
  customMeta: Record<string, string>;
}

export interface PerformanceData {
  loadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  totalBlockingTime?: number;
  pageSize?: number;
  requestCount?: number;
}

export interface SchemaData {
  type: string;
  data: Record<string, any>;
  valid: boolean;
  errors: string[];
}

export interface ContentData {
  wordCount: number;
  readabilityScore?: number;
  keywordDensity: Record<string, number>;
  hasStructuredContent: boolean;
  duplicateContent?: boolean;
}

export interface SEOAuditReport {
  url: string;
  timestamp: Date;
  overallScore: number;
  categoryScores: Record<string, number>;
  results: SEOCheckResult[];
  summary: {
    criticalIssues: number;
    warnings: number;
    passedChecks: number;
    totalChecks: number;
  };
  recommendations: string[];
  moduleResults: Record<string, any>;
}

export interface AuditModule {
  name: string;
  version: string;
  description: string;
  categories: string[];
  check(pageData: PageData): Promise<SEOCheckResult[]>;
  preprocess?(pageData: PageData): Promise<PageData>;
  supportedPlatforms?: string[];
}