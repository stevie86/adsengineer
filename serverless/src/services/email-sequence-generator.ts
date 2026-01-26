import { z } from 'zod';
import { LeadScoring, ScoringResult } from './lead-scoring';

export const EmailTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['awareness', 'consideration', 'decision', 'nurture', 'follow-up']),
  leadScoreRange: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  industry: z.enum(['ecommerce', 'retail', 'saas', 'b2b', 'other']).optional(),
  subject: z.string(),
  body: z.string(),
  variables: z.array(z.string()),
  personalizationRules: z.array(
    z.object({
      condition: z.string(),
      action: z.string(),
      value: z.string(),
    })
  ),
  sendDelay: z.object({
    hours: z.number().min(0).max(720),
    days: z.number().min(0).max(30),
  }),
  priority: z.enum(['high', 'medium', 'low']),
  aBTest: z.object({
    enabled: z.boolean(),
    variations: z.array(
      z.object({
        name: z.string(),
        subject: z.string().optional(),
        body: z.string().optional(),
        weight: z.number().min(0).max(1),
      })
    ),
  }),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

export const EmailSequenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  leadScoreRange: z.object({
    min: z.number().min(0).max(100),
    max: z.number().min(0).max(100),
  }),
  industry: z.enum(['ecommerce', 'retail', 'saas', 'b2b', 'other']).optional(),
  sequenceType: z.enum([
    'welcome',
    'nurture',
    'reactivation',
    'demo-request',
    'follow-up',
    'abandonment',
  ]),
  steps: z.array(
    z.object({
      stepNumber: z.number().min(1),
      templateId: z.string(),
      delay: z.object({
        hours: z.number().min(0).max(720),
        days: z.number().min(0).max(30),
      }),
      conditions: z.array(z.string()).optional(),
      stopConditions: z.array(z.string()).optional(),
    })
  ),
  settings: z.object({
    maxSteps: z.number().min(1).max(20),
    retryPolicy: z.object({
      enabled: z.boolean(),
      maxRetries: z.number().min(0).max(5),
      retryDelay: z.object({
        hours: z.number().min(1).max(168),
      }),
    }),
    scheduling: z.object({
      timezone: z.string(),
      sendDays: z.array(
        z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      ),
      sendHours: z.object({
        start: z.number().min(0).max(23),
        end: z.number().min(0).max(23),
      }),
    }),
  }),
  performance: z
    .object({
      totalSends: z.number().default(0),
      openRate: z.number().min(0).max(1).default(0),
      clickRate: z.number().min(0).max(1).default(0),
      replyRate: z.number().min(0).max(1).default(0),
      unsubscribeRate: z.number().min(0).max(1).default(0),
      conversionRate: z.number().min(0).max(1).default(0),
    })
    .optional(),
  lastUpdated: z.date(),
  isActive: z.boolean(),
});

export type EmailSequence = z.infer<typeof EmailSequenceSchema>;

export const EmailCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  sequenceId: z.string(),
  targetSegment: z.object({
    leadScoreMin: z.number().min(0).max(100),
    leadScoreMax: z.number().min(0).max(100),
    industries: z.array(z.enum(['ecommerce', 'retail', 'saas', 'b2b', 'other'])).optional(),
    excludeExistingCustomers: z.boolean(),
    excludeRecentContacts: z.object({
      enabled: z.boolean(),
      days: z.number().min(1).max(365),
    }),
    customFilters: z.array(
      z.object({
        field: z.string(),
        operator: z.enum([
          'equals',
          'not_equals',
          'contains',
          'not_contains',
          'greater_than',
          'less_than',
        ]),
        value: z.string(),
      })
    ),
  }),
  scheduling: z.object({
    startDate: z.date(),
    endDate: z.date(),
    batchSize: z.number().min(1).max(10000),
    sendFrequency: z.enum(['immediate', 'daily', 'weekly']),
    throttleRate: z.number().min(1).max(1000),
  }),
  tracking: z.object({
    enabled: z.boolean(),
    utmParameters: z.object({
      source: z.string(),
      medium: z.string(),
      campaign: z.string(),
      content: z.string().optional(),
    }),
  }),
  status: z.enum(['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled']),
  metrics: z.object({
    totalLeads: z.number(),
    sentEmails: z.number(),
    deliveredEmails: z.number(),
    openedEmails: z.number(),
    clickedEmails: z.number(),
    repliedEmails: z.number(),
    unsubscribedEmails: z.number(),
    conversions: z.number(),
    revenue: z.number(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;

export const PersonalizedEmailSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  leadId: z.string(),
  templateId: z.string(),
  personalizedSubject: z.string(),
  personalizedBody: z.string(),
  variables: z.record(z.string()),
  personalizationData: z.object({
    leadScore: z.number(),
    industry: z.string(),
    companySize: z.string(),
    painPoints: z.array(z.string()),
    techStack: z.array(z.string()),
    recentActivity: z.array(z.string()),
  }),
  sendTime: z.date(),
  status: z.enum([
    'scheduled',
    'sent',
    'delivered',
    'opened',
    'clicked',
    'replied',
    'bounced',
    'unsubscribed',
  ]),
  tracking: z.object({
    openCount: z.number().default(0),
    clickCount: z.number().default(0),
    lastOpened: z.date().optional(),
    lastClicked: z.date().optional(),
    deviceTypes: z.array(z.string()),
    locations: z.array(z.string()),
  }),
  abTest: z.object({
    enabled: z.boolean(),
    variant: z.string().optional(),
    group: z.enum(['control', 'variant']).optional(),
  }),
});

export type PersonalizedEmail = z.infer<typeof PersonalizedEmailSchema>;

export class EmailSequenceGenerator {
  private templates: Map<string, EmailTemplate> = new Map();
  private sequences: Map<string, EmailSequence> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultSequences();
  }

  generatePersonalizedSequence(leadData: LeadScoring, scoringResult: ScoringResult): EmailSequence {
    const category = this.determineSequenceCategory(scoringResult);
    const industry = leadData.businessInfo.industry;

    const baseSequence = this.findBestMatchingSequence(
      scoringResult.overallScore,
      industry,
      category
    );
    const personalizedSequence = this.personalizeSequence(baseSequence, leadData, scoringResult);

    return personalizedSequence;
  }

  generatePersonalizedEmail(
    template: EmailTemplate,
    leadData: LeadScoring,
    scoringResult: ScoringResult
  ): PersonalizedEmail {
    const personalizationData = this.extractPersonalizationData(leadData, scoringResult);
    const variables = this.buildVariableMap(leadData, scoringResult, personalizationData);

    const personalizedSubject = this.applyPersonalization(
      template.subject,
      variables,
      personalizationData
    );
    const personalizedBody = this.applyPersonalization(
      template.body,
      variables,
      personalizationData
    );

    return {
      id: crypto.randomUUID(),
      campaignId: '',
      leadId: '',
      templateId: template.id,
      personalizedSubject,
      personalizedBody,
      variables,
      personalizationData,
      sendTime: new Date(),
      status: 'scheduled',
      tracking: {
        openCount: 0,
        clickCount: 0,
        deviceTypes: [],
        locations: [],
      },
      abTest: {
        enabled: template.aBTest.enabled,
        variant: undefined,
        group: undefined,
      },
    };
  }

  async optimizeTemplate(template: EmailTemplate, performanceData: any): Promise<EmailTemplate> {
    const optimizedTemplate = { ...template };

    if (performanceData.openRate < 0.2) {
      optimizedTemplate.subject = await this.optimizeSubjectLine(template.subject, performanceData);
    }

    if (performanceData.clickRate < 0.05) {
      optimizedTemplate.body = await this.optimizeBodyContent(template.body, performanceData);
    }

    return optimizedTemplate;
  }

  createCampaign(
    name: string,
    description: string,
    sequenceId: string,
    targetSegment: any
  ): EmailCampaign {
    const campaign: EmailCampaign = {
      id: crypto.randomUUID(),
      name,
      description,
      sequenceId,
      targetSegment,
      scheduling: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        batchSize: 1000,
        sendFrequency: 'daily',
        throttleRate: 100,
      },
      tracking: {
        enabled: true,
        utmParameters: {
          source: 'email',
          medium: 'outreach',
          campaign: name.toLowerCase().replace(/\s+/g, '_'),
        },
      },
      status: 'draft',
      metrics: {
        totalLeads: 0,
        sentEmails: 0,
        deliveredEmails: 0,
        openedEmails: 0,
        clickedEmails: 0,
        repliedEmails: 0,
        unsubscribedEmails: 0,
        conversions: 0,
        revenue: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  private determineSequenceCategory(scoringResult: ScoringResult): string {
    if (scoringResult.category === 'hot') return 'decision';
    if (scoringResult.category === 'warm') return 'consideration';
    return 'awareness';
  }

  private findBestMatchingSequence(
    leadScore: number,
    industry: string,
    category: string
  ): EmailSequence {
    const matchingSequences = Array.from(this.sequences.values()).filter(
      (seq) =>
        leadScore >= seq.leadScoreRange.min &&
        leadScore <= seq.leadScoreRange.max &&
        (seq.industry === industry || !seq.industry) &&
        seq.sequenceType === category
    );

    if (matchingSequences.length === 0) {
      return this.getDefaultSequenceForCategory(category);
    }

    return matchingSequences[0];
  }

  private personalizeSequence(
    sequence: EmailSequence,
    leadData: LeadScoring,
    scoringResult: ScoringResult
  ): EmailSequence {
    const personalizedSequence = { ...sequence };
    personalizedSequence.id = crypto.randomUUID();

    personalizedSequence.steps = sequence.steps.map((step) => ({
      ...step,
      conditions: this.addPersonalizationConditions(step.conditions, leadData, scoringResult),
    }));

    return personalizedSequence;
  }

  private extractPersonalizationData(leadData: LeadScoring, scoringResult: ScoringResult): any {
    const yearlyRevenue =
      leadData.businessInfo.revenue.yearly || leadData.businessInfo.revenue.monthly * 12;
    const companySize = this.categorizeCompanySize(leadData.businessInfo.employeeCount.total);

    return {
      leadScore: scoringResult.overallScore,
      industry: leadData.businessInfo.industry,
      companySize,
      painPoints: leadData.businessInfo.painPoints,
      techStack: leadData.businessInfo.techStack.platforms,
      recentActivity: [], // Would come from activity tracking
      estimatedRevenue: yearlyRevenue,
      hasHighSpend: leadData.budgetInfo.monthlyAdSpend > 10000,
      decisionMaker: leadData.budgetInfo.decisionMaker,
      marketPosition: leadData.businessInfo.marketPosition,
    };
  }

  private buildVariableMap(
    leadData: LeadScoring,
    scoringResult: ScoringResult,
    personalizationData: any
  ): Record<string, string> {
    return {
      firstName: leadData.contactInfo.firstName,
      lastName: leadData.contactInfo.lastName,
      email: leadData.contactInfo.email,
      company: leadData.contactInfo.company || 'their company',
      title: leadData.contactInfo.title || '',
      industry: personalizationData.industry,
      companySize: personalizationData.companySize,
      leadScore: scoringResult.overallScore.toString(),
      category: scoringResult.category,
      painPoints: personalizationData.painPoints.join(', '),
      techStack: personalizationData.techStack.join(', '),
      estimatedRevenue: this.formatCurrency(personalizationData.estimatedRevenue),
      monthlyAdSpend: this.formatCurrency(leadData.budgetInfo.monthlyAdSpend),
      decisionMaker: personalizationData.decisionMaker ? 'decision maker' : 'influencer',
      marketPosition: personalizationData.marketPosition,
    };
  }

  private applyPersonalization(
    content: string,
    variables: Record<string, string>,
    personalizationData: any
  ): string {
    let personalizedContent = content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      personalizedContent = personalizedContent.replace(regex, value);
    }

    personalizedContent = this.applyConditionalPersonalization(
      personalizedContent,
      personalizationData
    );

    return personalizedContent;
  }

  private applyConditionalPersonalization(content: string, personalizationData: any): string {
    if (personalizationData.painPoints.includes('poor-attribution')) {
      content = content.replace(/\[if:attribution-problem\](.*?)\[endif\]/gs, '$1');
    } else {
      content = content.replace(/\[if:attribution-problem\](.*?)\[endif\]/gs, '');
    }

    if (personalizationData.hasHighSpend) {
      content = content.replace(/\[if:high-spend\](.*?)\[endif\]/gs, '$1');
    } else {
      content = content.replace(/\[if:high-spend\](.*?)\[endif\]/gs, '');
    }

    if (personalizationData.decisionMaker) {
      content = content.replace(/\[if:decision-maker\](.*?)\[endif\]/gs, '$1');
    } else {
      content = content.replace(/\[if:decision-maker\](.*?)\[endif\]/gs, '');
    }

    return content;
  }

  private categorizeCompanySize(totalEmployees: number): string {
    if (totalEmployees >= 1000) return 'Enterprise';
    if (totalEmployees >= 100) return 'Medium';
    if (totalEmployees >= 10) return 'Small';
    return 'Startup';
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private addPersonalizationConditions(
    conditions: string[] = [],
    leadData: LeadScoring,
    scoringResult: ScoringResult
  ): string[] {
    const personalizedConditions = [...conditions];

    if (leadData.businessInfo.painPoints.includes('no-conversion-tracking')) {
      personalizedConditions.push('conversion_tracking_problem');
    }

    if (scoringResult.overallScore >= 80) {
      personalizedConditions.push('high_lead_score');
    }

    return personalizedConditions;
  }

  private async optimizeSubjectLine(subject: string, performanceData: any): Promise<string> {
    if (performanceData.subjectLineTestResults) {
      const bestVariant = performanceData.subjectLineTestResults.sort(
        (a: any, b: any) => b.openRate - a.openRate
      )[0];
      return bestVariant.subject;
    }

    return this.generatePersonalizedSubject(subject, performanceData);
  }

  private async optimizeBodyContent(body: string, performanceData: any): Promise<string> {
    if (performanceData.contentTestResults) {
      const bestVariant = performanceData.contentTestResults.sort(
        (a: any, b: any) => b.clickRate - a.clickRate
      )[0];
      return bestVariant.body;
    }

    return this.optimizeBodyForEngagement(body, performanceData);
  }

  private generatePersonalizedSubject(subject: string, data: any): string {
    const personalization = [
      'Quick question about {{company}}',
      '{{firstName}}, thoughts on attribution?',
      'Regarding your ad spend at {{company}}',
      '{{industry}} attribution insights',
    ];

    return personalization[Math.floor(Math.random() * personalization.length)];
  }

  private optimizeBodyForEngagement(body: string, data: any): string {
    if (data.clickRate < 0.05) {
      const ctaRegex = /(call to action|click here|learn more)/gi;
      body = body.replace(ctaRegex, "🚀 Click to see how much you're wasting on ads");
    }

    if (data.openRate < 0.2) {
      const personalizationRegex = /\[if:personalization\](.*?)\[endif\]/gs;
      body = body.replace(personalizationRegex, '{{firstName}}, $1');
    }

    return body;
  }

  private getDefaultSequenceForCategory(category: string): EmailSequence {
    const defaultSequence: EmailSequence = {
      id: crypto.randomUUID(),
      name: `Default ${category} Sequence`,
      description: `Default sequence for ${category} stage leads`,
      leadScoreRange: { min: 0, max: 100 },
      sequenceType: category as any,
      steps: [
        {
          stepNumber: 1,
          templateId: 'initial-contact',
          delay: { hours: 0, days: 0 },
        },
        {
          stepNumber: 2,
          templateId: 'follow-up',
          delay: { hours: 48, days: 2 },
        },
      ],
      settings: {
        maxSteps: 5,
        retryPolicy: {
          enabled: true,
          maxRetries: 3,
          retryDelay: { hours: 24 },
        },
        scheduling: {
          timezone: 'UTC',
          sendDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          sendHours: { start: 9, end: 17 },
        },
      },
      performance: {
        totalSends: 0,
        openRate: 0,
        clickRate: 0,
        replyRate: 0,
        unsubscribeRate: 0,
        conversionRate: 0,
      },
      lastUpdated: new Date(),
      isActive: true,
    };

    this.sequences.set(defaultSequence.id, defaultSequence);
    return defaultSequence;
  }

  private initializeDefaultTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        id: 'initial-contact',
        name: 'Initial Contact',
        description: 'First touch email for new leads',
        category: 'awareness',
        leadScoreRange: { min: 0, max: 100 },
        subject: "{{firstName}}, quick question about {{company}}'s attribution",
        body: `Hi {{firstName}},

I noticed {{company}} is doing great in the {{industry}} space. 

[if:attribution-problem]
Most {{industry}} businesses we work with are losing 30%+ of their ad budget to poor attribution. Are you seeing similar challenges with your {{monthlyAdSpend}} monthly spend?
[endif]

[if:decision-maker]
As a {{title}}, you're probably looking for ways to optimize your marketing ROI.
[endif]

Would you be open to a quick 15-minute call to discuss how we're helping similar {{industry}} companies reduce ad waste?

Best regards,
Your name`,
        variables: ['firstName', 'company', 'industry', 'monthlyAdSpend', 'title'],
        personalizationRules: [],
        sendDelay: { hours: 0, days: 0 },
        priority: 'high',
        aBTest: {
          enabled: true,
          variations: [
            {
              name: 'Urgency',
              subject: '{{firstName}}, {{company}} ad waste analysis',
              weight: 0.5,
            },
            {
              name: 'Value',
              subject: "Reduce {{company}}'s ad spend waste",
              weight: 0.5,
            },
          ],
        },
      },
    ];

    templates.forEach((template) => this.templates.set(template.id, template));
  }

  private initializeDefaultSequences(): void {
    const sequences: EmailSequence[] = [
      {
        id: 'awareness-sequence',
        name: 'Awareness Nurture Sequence',
        description: 'Multi-touch sequence for awareness stage leads',
        leadScoreRange: { min: 0, max: 59 },
        sequenceType: 'nurture',
        steps: [
          {
            stepNumber: 1,
            templateId: 'initial-contact',
            delay: { hours: 0, days: 0 },
          },
          {
            stepNumber: 2,
            templateId: 'value-proposition',
            delay: { hours: 72, days: 3 },
          },
          {
            stepNumber: 3,
            templateId: 'case-study',
            delay: { hours: 120, days: 5 },
          },
        ],
        settings: {
          maxSteps: 6,
          retryPolicy: {
            enabled: true,
            maxRetries: 2,
            retryDelay: { hours: 48 },
          },
          scheduling: {
            timezone: 'UTC',
            sendDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            sendHours: { start: 9, end: 16 },
          },
        },
        performance: {
          totalSends: 0,
          openRate: 0,
          clickRate: 0,
          replyRate: 0,
          unsubscribeRate: 0,
          conversionRate: 0,
        },
        lastUpdated: new Date(),
        isActive: true,
      },
    ];

    sequences.forEach((sequence) => this.sequences.set(sequence.id, sequence));
  }

  getTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  getSequences(): EmailSequence[] {
    return Array.from(this.sequences.values());
  }

  getCampaigns(): EmailCampaign[] {
    return Array.from(this.campaigns.values());
  }
}
