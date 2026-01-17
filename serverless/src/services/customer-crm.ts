import { z } from 'zod';
import { LeadScoring, ScoringResult } from './lead-scoring';
import { OutreachExecution } from './outreach-orchestration';
import { SalesNavigatorLead } from './linkedin-sales-navigator';

export const CustomerSchema = z.object({
  id: z.string(),
  leadId: z.string(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    title: z.string().optional(),
    company: z.string(),
    website: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    industry: z.string(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional()
    }).optional()
  }),
  businessInfo: z.object({
    industry: z.enum(['ecommerce', 'retail', 'saas', 'b2b', 'other']),
    revenue: z.object({
      monthly: z.number().min(0),
      yearly: z.number().min(0),
      currency: z.string().default('USD')
    }),
    employeeCount: z.number().min(1),
    foundedYear: z.number().optional(),
    marketPosition: z.enum(['startup', 'challenger', 'leader', 'niche']),
    techStack: z.object({
      platforms: z.array(z.enum(['shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom'])),
      analytics: z.array(z.string()),
      advertising: z.array(z.string()),
      crm: z.string(),
      otherTools: z.array(z.string())
    }),
    painPoints: z.array(z.string()),
    budgetInfo: z.object({
      monthlyMarketingBudget: z.number().min(0),
      decisionMaker: z.boolean(),
      decisionProcess: z.enum(['unanimous', 'consensus', 'individual', 'committee']),
      salesCycle: z.number().min(1),
      implementationTimeline: z.enum(['immediate', '30_days', '90_days', '6_months', 'unknown'])
    })
  }),
  scoring: z.object({
    currentScore: z.number().min(0).max(100),
    initialScore: z.number().min(0).max(100),
    scoreHistory: z.array(z.object({
      score: z.number(),
      date: z.date(),
      reason: z.string(),
      factors: z.record(z.number())
    })),
    category: z.enum(['hot-lead', 'warm-lead', 'cool-lead', 'cold-lead']),
    lastScored: z.date(),
    scoringFactors: z.record(z.number())
  }),
  lifecycle: z.object({
    status: z.enum(['new', 'contacted', 'engaged', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost', 'dormant', 'reactivated']),
    subStatus: z.string().optional(),
    stage: z.enum(['awareness', 'interest', 'consideration', 'intent', 'evaluation', 'purchase', 'post-purchase']),
    probability: z.number().min(0).max(1),
    expectedCloseDate: z.date().optional(),
    estimatedValue: z.number().min(0),
    currency: z.string().default('USD'),
    source: z.string(),
    assignedTo: z.string().optional(),
    tags: z.array(z.string()),
    priority: z.enum(['low', 'medium', 'high', 'urgent'])
  }),
  engagement: z.object({
    totalContacts: z.number().default(0),
    lastContactDate: z.date().optional(),
    lastContactType: z.enum(['email', 'phone', 'linkedin', 'meeting', 'event', 'other']).optional(),
    nextFollowUp: z.date().optional(),
    preferredContactMethod: z.enum(['email', 'phone', 'linkedin', 'sms', 'meeting']).optional(),
    contactFrequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'as_needed']),
    responseTime: z.object({
      average: z.number().optional(),
      lastResponse: z.number().optional()
    }),
    engagementScore: z.number().min(0).max(100),
    channelPreference: z.record(z.number()),
    doNotContact: z.boolean().default(false)
  }),
  sales: z.object({
    dealStage: z.enum(['discovery', 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
    dealValue: z.number().min(0),
    probability: z.number().min(0).max(1),
    expectedCloseDate: z.date().optional(),
    products: z.array(z.object({
      name: z.string(),
      category: z.enum(['attribution', 'analytics', 'automation', 'enterprise', 'consulting']),
      price: z.number(),
      quantity: z.number(),
      totalValue: z.number(),
      currency: z.string().default('USD')
    })),
    competition: z.array(z.object({
      name: z.string(),
      strength: z.enum(['weak', 'moderate', 'strong']),
      status: z.enum(['considering', 'evaluating', 'selected', 'lost_to'])
    })),
    objections: z.array(z.object({
      type: z.enum(['price', 'timing', 'need', 'authority', 'competition', 'feature', 'implementation']),
      description: z.string(),
      status: z.enum(['open', 'addressed', 'overcome']),
      date: z.date()
    })),
    nextAction: z.object({
      type: z.enum(['call', 'email', 'meeting', 'demo', 'proposal', 'follow_up', 'closing']),
      description: z.string(),
      scheduledFor: z.date(),
      assignedTo: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent'])
    })
  }),
  enrichment: z.object({
    linkedinProfile: SalesNavigatorLead.optional(),
    companyData: z.object({
      description: z.string().optional(),
      website: z.string().url().optional(),
      industry: z.string().optional(),
      size: z.string().optional(),
      revenue: z.number().optional(),
      founded: z.number().optional(),
      headquarters: z.string().optional(),
      specialties: z.array(z.string()),
      recentNews: z.array(z.object({
        title: z.string(),
        source: z.string(),
        url: z.string().url(),
        date: z.date()
      }))
    }),
    marketData: z.object({
      industryTrends: z.array(z.string()),
      competitorInsights: z.array(z.string()),
      marketSize: z.number().optional(),
      growthRate: z.number().optional()
    }),
    technographics: z.object({
      advertisingPlatforms: z.array(z.string()),
      analyticsTools: z.array(z.string()),
      crmSystems: z.array(z.string()),
      ecommercePlatforms: z.array(z.string()),
      integrationMaturity: z.enum(['basic', 'intermediate', 'advanced', 'enterprise'])
    }),
    firmographics: z.object({
      businessModel: z.string().optional(),
      customerSegments: z.array(z.string()),
      valueProposition: z.string().optional(),
      competitivePosition: z.enum(['leader', 'challenger', 'follower', 'niche_player'])
    })
  }),
  timestamps: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    firstContact: z.date().optional(),
    lastActivity: z.date().optional(),
    qualifiedDate: z.date().optional(),
    proposalDate: z.date().optional(),
    closedDate: z.date().optional()
  }),
  customFields: z.record(z.any()),
  notes: z.array(z.object({
    id: z.string(),
    content: z.string(),
    type: z.enum(['call', 'meeting', 'email', 'research', 'general']),
    author: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    isPrivate: z.boolean().default(false)
  }))
});

export type Customer = z.infer<typeof CustomerSchema>;

export const LeadPipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  stages: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    order: z.number().min(1),
    criteria: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    })),
    autoAdvance: z.boolean().default(false),
    timeInStage: z.number().optional(),
    winRate: z.number().min(0).max(1).optional(),
    averageValue: z.number().optional()
  })),
  settings: z.object({
    allowStageSkipping: z.boolean().default(false),
    requireStageCompletion: z.boolean().default(true),
    autoAssignment: z.object({
      enabled: z.boolean(),
      rules: z.array(z.object({
        condition: z.string(),
        assignTo: z.string()
      }))
    }),
    notifications: z.object({
      stageChange: z.boolean(),
      inactivity: z.boolean(),
      scoreChange: z.boolean(),
      highValue: z.boolean()
    })
  }),
  metrics: z.object({
    totalLeads: z.number().default(0),
    activeLeads: z.number().default(0),
    conversionRate: z.number().min(0).max(1).default(0),
    averageDealSize: z.number().default(0),
    averageSalesCycle: z.number().default(0),
    pipelineValue: z.number().default(0),
    weightedValue: z.number().default(0),
    stageDistribution: z.record(z.number())
  }),
  lastUpdated: z.date()
});

export type LeadPipeline = z.infer<typeof LeadPipelineSchema>;

export const CustomerLifecycleEventSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  eventType: z.enum([
    'created',
    'score_updated',
    'contact_attempted',
    'contact_successful',
    'stage_changed',
    'engagement_detected',
    'outreach_sent',
    'response_received',
    'meeting_scheduled',
    'demo_completed',
    'proposal_sent',
    'objection_raised',
    'objection_handled',
    'deal_won',
    'deal_lost',
    'reassigned',
    'dormant_activated',
    'enrichment_completed',
    'custom'
  ]),
  eventData: z.object({
    previousValue: z.any().optional(),
    newValue: z.any().optional(),
    reason: z.string().optional(),
    channel: z.string().optional(),
    campaignId: z.string().optional(),
    executionId: z.string().optional(),
    metadata: z.record(z.any())
  }),
  timestamp: z.date(),
  triggeredBy: z.enum(['system', 'user', 'automation', 'api']).default('system'),
  impact: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  scoreImpact: z.number().min(-10).max(10).default(0),
  automatedAction: z.object({
    type: z.enum(['none', 'follow_up_scheduled', 'stage_changed', 'score_adjusted', 'notification_sent', 'tag_added']),
    description: z.string(),
    executed: z.boolean(),
    scheduledFor: z.date().optional()
  })
});

export type CustomerLifecycleEvent = z.infer<typeof CustomerLifecycleEventSchema>;

export class CustomerManagementCRM {
  private customers: Map<string, Customer> = new Map();
  private pipelines: Map<string, LeadPipeline> = new Map();
  private events: Map<string, CustomerLifecycleEvent[]> = new Map();
  private defaultPipeline: LeadPipeline;

  constructor() {
    this.initializeDefaultPipeline();
  }

  createCustomer(customerData: Omit<Customer, 'id' | 'timestamps' | 'lifecycle'>): Customer {
    const customer: Customer = {
      id: crypto.randomUUID(),
      ...customerData,
      timestamps: {
        createdAt: new Date(),
        updatedAt: new Date(),
        firstContact: new Date(),
        lastActivity: new Date()
      },
      lifecycle: {
        ...customerData.lifecycle,
        status: 'new',
        stage: 'awareness',
        probability: 0.1,
        priority: customerData.lifecycle?.priority || 'medium'
      },
      engagement: {
        ...customerData.engagement,
        totalContacts: 0,
        engagementScore: 0,
        channelPreference: {}
      },
      scoring: {
        currentScore: customerData.scoring?.currentScore || 50,
        initialScore: customerData.scoring?.currentScore || 50,
        scoreHistory: customerData.scoring?.scoreHistory || [],
        category: this.categorizeLead(customerData.scoring?.currentScore || 50),
        lastScored: new Date(),
        scoringFactors: customerData.scoring?.scoringFactors || {}
      }
    };

    this.customers.set(customer.id, customer);
    this.recordLifecycleEvent(customer.id, 'created', {
      reason: 'New customer created in CRM',
      previousValue: null,
      newValue: customer.lifecycle.status
    });

    return customer;
  }

  updateLifecycle(customerId: string, newStatus: Customer['lifecycle']['status'], reason?: string): Customer {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const previousStatus = customer.lifecycle.status;
    customer.lifecycle.status = newStatus;
    customer.timestamps.updated = new Date();

    if (['qualified', 'proposal', 'negotiation'].includes(newStatus)) {
      customer.lifecycle.stage = this.mapStatusToStage(newStatus);
      customer.lifecycle.probability = this.calculateProbability(newStatus);
    }

    if (newStatus === 'closed-won') {
      customer.timestamps.closedDate = new Date();
      customer.lifecycle.stage = 'purchase';
      customer.lifecycle.probability = 1.0;
    }

    if (newStatus === 'closed-lost') {
      customer.timestamps.closedDate = new Date();
      customer.lifecycle.stage = 'evaluation';
      customer.lifecycle.probability = 0.0;
    }

    this.customers.set(customerId, customer);

    this.recordLifecycleEvent(customerId, 'stage_changed', {
      reason: reason || `Stage changed from ${previousStatus} to ${newStatus}`,
      previousValue: previousStatus,
      newValue: newStatus,
      automatedAction: {
        type: 'stage_changed',
        description: `Customer lifecycle updated to ${newStatus}`,
        executed: true
      }
    });

    return customer;
  }

  recordEngagement(customerId: string, engagementData: {
    type: Customer['engagement']['lastContactType'];
    channel: string;
    result: string;
    notes?: string;
    duration?: number;
  }): Customer {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    customer.engagement.totalContacts += 1;
    customer.engagement.lastContactDate = new Date();
    customer.engagement.lastContactType = engagementData.type;
    customer.timestamps.lastActivity = new Date();

    const channelScore = customer.engagement.channelPreference[engagementData.channel] || 0;
    customer.engagement.channelPreference[engagementData.channel] = channelScore + 1;

    customer.engagement.engagementScore = this.calculateEngagementScore(customer.engagement);
    customer.lifecycle.stage = this.advanceLifecycleStage(customer.lifecycle.stage, engagementData.result);

    this.customers.set(customerId, customer);

    this.recordLifecycleEvent(customerId, 'contact_successful', {
      channel: engagementData.channel,
      metadata: {
        type: engagementData.type,
        result: engagementData.result,
        duration: engagementData.duration,
        notes: engagementData.notes
      },
      automatedAction: {
        type: 'none',
        description: 'Engagement recorded successfully'
      }
    });

    return customer;
  }

  addLifecycleEvent(customerId: string, eventType: CustomerLifecycleEvent['eventType'], eventData?: any): CustomerLifecycleEvent {
    const event: CustomerLifecycleEvent = {
      id: crypto.randomUUID(),
      customerId,
      eventType,
      eventData: {
        ...eventData,
        timestamp: new Date()
      },
      timestamp: new Date(),
      impact: 'medium',
      scoreImpact: this.calculateScoreImpact(eventType),
      automatedAction: {
        type: 'none',
        description: 'Event recorded',
        executed: false
      }
    };

    const customerEvents = this.events.get(customerId) || [];
    customerEvents.push(event);
    this.events.set(customerId, customerEvents);

    if (eventData?.scoreImpact) {
      this.adjustCustomerScore(customerId, eventData.scoreImpact, `Lifecycle event: ${eventType}`);
    }

    return event;
  }

  updateScore(customerId: string, newScore: number, factors?: Record<string, number>): Customer {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const previousScore = customer.scoring.currentScore;
    customer.scoring.currentScore = newScore;
    customer.scoring.lastScored = new Date();
    customer.scoring.category = this.categorizeLead(newScore);

    if (factors) {
      customer.scoring.scoringFactors = { ...customer.scoring.scoringFactors, ...factors };
    }

    customer.scoring.scoreHistory.push({
      score: newScore,
      date: new Date(),
      reason: 'Score updated',
      factors: factors || {}
    });

    customer.lifecycle.probability = this.mapScoreToProbability(newScore);
    customer.timestamps.updated = new Date();

    this.customers.set(customerId, customer);

    this.recordLifecycleEvent(customerId, 'score_updated', {
      reason: `Lead score updated from ${previousScore} to ${newScore}`,
      previousValue: previousScore,
      newValue: newScore,
      metadata: { factors }
    });

    return customer;
  }

  assignCustomer(customerId: string, assignTo: string, reason?: string): Customer {
    const customer = this.customers.get(customerId);
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const previousAssignee = customer.lifecycle.assignedTo;
    customer.lifecycle.assignedTo = assignTo;
    customer.timestamps.updated = new Date();

    this.customers.set(customerId, customer);

    this.recordLifecycleEvent(customerId, 'reassigned', {
      reason: reason || `Customer assigned to ${assignTo}`,
      previousValue: previousAssignee,
      newValue: assignTo,
      automatedAction: {
        type: 'notification_sent',
        description: `Assignment notification sent to ${assignTo}`,
        executed: true
      }
    });

    return customer;
  }

  getPipelineMetrics(pipelineId: string = 'default'): any {
    const pipeline = this.pipelines.get(pipelineId) || this.defaultPipeline;
    const allCustomers = Array.from(this.customers.values());

    const pipelineCustomers = allCustomers.filter(customer => 
      customer.lifecycle.status !== 'closed-won' && customer.lifecycle.status !== 'closed-lost'
    );

    const stageDistribution: Record<string, number> = {};
    let totalValue = 0;
    let weightedValue = 0;

    for (const stage of pipeline.stages) {
      const stageCustomers = pipelineCustomers.filter(c => 
        this.isCustomerInStage(c, stage)
      );
      stageDistribution[stage.name] = stageCustomers.length;

      const stageValue = stageCustomers.reduce((sum, c) => sum + (c.lifecycle.estimatedValue || 0), 0);
      const stageWeight = stage.winRate || 0.5;
      totalValue += stageValue;
      weightedValue += stageValue * stageWeight;
    }

    const closedWon = allCustomers.filter(c => c.lifecycle.status === 'closed-won');
    const closedLost = allCustomers.filter(c => c.lifecycle.status === 'closed-lost');
    
    const conversionRate = (closedWon.length + closedLost.length) > 0 ? 
      closedWon.length / (closedWon.length + closedLost.length) : 0;

    const averageDealSize = closedWon.length > 0 ? 
      closedWon.reduce((sum, c) => sum + (c.lifecycle.estimatedValue || 0), 0) / closedWon.length : 0;

    const averageSalesCycle = this.calculateAverageSalesCycle(closedWon);

    return {
      totalLeads: pipelineCustomers.length,
      activeLeads: pipelineCustomers.filter(c => 
        ['new', 'contacted', 'engaged', 'qualified', 'proposal', 'negotiation'].includes(c.lifecycle.status)
      ).length,
      conversionRate,
      averageDealSize,
      averageSalesCycle,
      pipelineValue: totalValue,
      weightedValue,
      stageDistribution,
      closedWon: closedWon.length,
      closedLost: closedLost.length
    };
  }

  getCustomerTimeline(customerId: string): CustomerLifecycleEvent[] {
    return this.events.get(customerId) || [];
  }

  getCustomersByStage(stage: string): Customer[] {
    return Array.from(this.customers.values()).filter(customer => 
      customer.lifecycle.stage === stage
    );
  }

  getHighValueCustomers(minValue: number = 10000): Customer[] {
    return Array.from(this.customers.values()).filter(customer => 
      customer.lifecycle.estimatedValue >= minValue &&
      ['qualified', 'proposal', 'negotiation'].includes(customer.lifecycle.status)
    );
  }

  getDormantCustomers(days: number = 30): Customer[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return Array.from(this.customers.values()).filter(customer => 
      customer.timestamps.lastActivity &&
      customer.timestamps.lastActivity < cutoffDate &&
      !['closed-won', 'closed-lost'].includes(customer.lifecycle.status)
    );
  }

  async automateNurturing(): Promise<Customer[]> {
    const customers = Array.from(this.customers.values());
    const automatedCustomers: Customer[] = [];

    for (const customer of customers) {
      const actions = await this.determineAutomatedActions(customer);
      
      for (const action of actions) {
        await this.executeAutomatedAction(customer, action);
        automatedCustomers.push(customer);
      }
    }

    return automatedCustomers;
  }

  private recordLifecycleEvent(customerId: string, eventType: string, eventData?: any): void {
    const event = this.addLifecycleEvent(customerId, eventType as any, eventData);
    
    const customerEvents = this.events.get(customerId) || [];
    customerEvents.push(event);
    this.events.set(customerId, customerEvents);
  }

  private categorizeLead(score: number): Customer['scoring']['category'] {
    if (score >= 80) return 'hot-lead';
    if (score >= 60) return 'warm-lead';
    if (score >= 40) return 'cool-lead';
    return 'cold-lead';
  }

  private mapStatusToStage(status: Customer['lifecycle']['status']): Customer['lifecycle']['stage'] {
    const stageMap: Record<string, Customer['lifecycle']['stage']> = {
      'new': 'awareness',
      'contacted': 'interest',
      'engaged': 'consideration',
      'qualified': 'intent',
      'proposal': 'evaluation',
      'negotiation': 'purchase',
      'closed-won': 'post-purchase',
      'closed-lost': 'evaluation'
    };

    return stageMap[status] || 'awareness';
  }

  private calculateProbability(status: Customer['lifecycle']['status']): number {
    const probabilityMap: Record<string, number> = {
      'new': 0.1,
      'contacted': 0.2,
      'engaged': 0.4,
      'qualified': 0.6,
      'proposal': 0.7,
      'negotiation': 0.8,
      'closed-won': 1.0,
      'closed-lost': 0.0
    };

    return probabilityMap[status] || 0.1;
  }

  private calculateEngagementScore(engagement: Customer['engagement']): number {
    let score = 0;
    
    if (engagement.totalContacts > 0) score += 20;
    if (engagement.totalContacts > 3) score += 20;
    if (engagement.totalContacts > 10) score += 20;
    
    if (engagement.lastContactDate) {
      const daysSinceContact = (Date.now() - engagement.lastContactDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceContact <= 7) score += 20;
      else if (daysSinceContact <= 30) score += 10;
      else if (daysSinceContact <= 90) score += 5;
    }

    const hasPreferredChannel = Object.values(engagement.channelPreference).some(count => count >= 3);
    if (hasPreferredChannel) score += 20;

    return Math.min(score, 100);
  }

  private advanceLifecycleStage(currentStage: Customer['lifecycle']['stage'], result: string): Customer['lifecycle']['stage'] {
    if (result === 'positive_response' || result === 'meeting_scheduled') {
      const stageFlow: Customer['lifecycle']['stage'][] = [
        'awareness', 'interest', 'consideration', 'intent', 'evaluation', 'purchase'
      ];
      
      const currentIndex = stageFlow.indexOf(currentStage);
      return stageFlow[Math.min(currentIndex + 1, stageFlow.length - 1)];
    }
    
    return currentStage;
  }

  private calculateScoreImpact(eventType: CustomerLifecycleEvent['eventType']): number {
    const impactMap: Record<string, number> = {
      'engagement_detected': 5,
      'response_received': 8,
      'meeting_scheduled': 10,
      'demo_completed': 15,
      'proposal_sent': 12,
      'objection_raised': -3,
      'objection_handled': 5,
      'deal_won': 25,
      'deal_lost': -20,
      'dormant_activated': 3,
      'enrichment_completed': 2
    };

    return impactMap[eventType] || 0;
  }

  private adjustCustomerScore(customerId: string, adjustment: number, reason: string): void {
    const customer = this.customers.get(customerId);
    if (!customer) return;

    const newScore = Math.max(0, Math.min(100, customer.scoring.currentScore + adjustment));
    this.updateScore(customerId, newScore);
  }

  private isCustomerInStage(customer: Customer, stage: any): boolean {
    if (stage.criteria.length === 0) return true;

    return stage.criteria.some((criteria: any) => {
      const customerValue = this.getCustomerField(customer, criteria.field);
      
      switch (criteria.operator) {
        case 'equals':
          return customerValue === criteria.value;
        case 'greater_than':
          return Number(customerValue) > Number(criteria.value);
        case 'contains':
          return String(customerValue).includes(String(criteria.value));
        default:
          return false;
      }
    });
  }

  private getCustomerField(customer: Customer, field: string): any {
    const fieldMap: Record<string, () => any> = {
      'status': () => customer.lifecycle.status,
      'score': () => customer.scoring.currentScore,
      'category': () => customer.scoring.category,
      'value': () => customer.lifecycle.estimatedValue,
      'probability': () => customer.lifecycle.probability
    };

    return fieldMap[field] ? fieldMap[field]() : null;
  }

  private calculateAverageSalesCycle(customers: Customer[]): number {
    if (customers.length === 0) return 0;

    const salesCycles = customers.map(c => {
      if (c.timestamps.firstContact && c.timestamps.closedDate) {
        return (c.timestamps.closedDate.getTime() - c.timestamps.firstContact.getTime()) / (24 * 60 * 60 * 1000);
      }
      return 0;
    }).filter(cycle => cycle > 0);

    return salesCycles.length > 0 ? 
      salesCycles.reduce((sum, cycle) => sum + cycle, 0) / salesCycles.length : 0;
  }

  private mapScoreToProbability(score: number): number {
    if (score >= 80) return 0.8;
    if (score >= 60) return 0.6;
    if (score >= 40) return 0.4;
    return 0.2;
  }

  private async determineAutomatedActions(customer: Customer): Promise<any[]> {
    const actions = [];

    if (customer.lifecycle.status === 'new') {
      actions.push({
        type: 'schedule_outreach',
        priority: 'high',
        description: 'Schedule initial outreach for new lead'
      });
    }

    if (customer.engagement.lastContactDate) {
      const daysSinceContact = (Date.now() - customer.engagement.lastContactDate.getTime()) / (24 * 60 * 60 * 1000);
      
      if (daysSinceContact > 30 && customer.lifecycle.status === 'engaged') {
        actions.push({
          type: 're_engage',
          priority: 'medium',
          description: 'Re-engage dormant lead'
        });
      }
    }

    if (customer.scoring.currentScore >= 70 && customer.lifecycle.status === 'qualified') {
      actions.push({
        type: 'schedule_demo',
        priority: 'high',
        description: 'Schedule product demo for high-scoring qualified lead'
      });
    }

    return actions;
  }

  private async executeAutomatedAction(customer: Customer, action: any): Promise<void> {
    switch (action.type) {
      case 'schedule_outreach':
        customer.lifecycle.nextFollowUp = new Date(Date.now() + 24 * 60 * 60 * 1000);
        break;
        
      case 're_engage':
        customer.lifecycle.stage = 'consideration';
        customer.lifecycle.status = 'reactivated';
        break;
        
      case 'schedule_demo':
        customer.sales.nextAction = {
          type: 'demo',
          description: 'Schedule product demonstration',
          scheduledFor: new Date(Date.now() + 48 * 60 * 60 * 1000),
          priority: 'high'
        };
        break;
    }

    this.customers.set(customer.id, customer);
  }

  private initializeDefaultPipeline(): void {
    this.defaultPipeline = {
      id: 'default',
      name: 'Standard Sales Pipeline',
      description: 'Default lead qualification and sales process',
      stages: [
        {
          id: 'awareness',
          name: 'Awareness',
          description: 'Lead is aware of our solution',
          order: 1,
          criteria: [],
          autoAdvance: false
        },
        {
          id: 'interest',
          name: 'Interest',
          description: 'Lead has shown initial interest',
          order: 2,
          criteria: [
            { field: 'totalContacts', operator: 'greater_than', value: 0 }
          ],
          autoAdvance: true
        },
        {
          id: 'consideration',
          name: 'Consideration',
          description: 'Lead is evaluating options',
          order: 3,
          criteria: [
            { field: 'engagementScore', operator: 'greater_than', value: 40 }
          ],
          autoAdvance: true
        },
        {
          id: 'intent',
          name: 'Intent',
          description: 'Lead has clear purchase intent',
          order: 4,
          criteria: [
            { field: 'score', operator: 'greater_than', value: 70 }
          ],
          autoAdvance: true
        },
        {
          id: 'evaluation',
          name: 'Evaluation',
          description: 'Lead is in active evaluation',
          order: 5,
          criteria: [
            { field: 'status', operator: 'equals', value: 'proposal' }
          ],
          autoAdvance: false
        },
        {
          id: 'purchase',
          name: 'Purchase',
          description: 'Deal closed and purchase made',
          order: 6,
          criteria: [
            { field: 'status', operator: 'contains', value: 'closed' }
          ],
          autoAdvance: false
        }
      ],
      settings: {
        allowStageSkipping: false,
        requireStageCompletion: true,
        autoAssignment: {
          enabled: false,
          rules: []
        },
        notifications: {
          stageChange: true,
          inactivity: true,
          scoreChange: true,
          highValue: true
        }
      },
      metrics: {
        totalLeads: 0,
        activeLeads: 0,
        conversionRate: 0,
        averageDealSize: 0,
        averageSalesCycle: 0,
        pipelineValue: 0,
        weightedValue: 0,
        stageDistribution: {}
      },
      lastUpdated: new Date()
    };

    this.pipelines.set('default', this.defaultPipeline);
  }

  getCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  getCustomer(customerId: string): Customer | undefined {
    return this.customers.get(customerId);
  }

  getPipelines(): LeadPipeline[] {
    return Array.from(this.pipelines.values());
  }
}