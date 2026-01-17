import { z } from 'zod';

export const OutreachChannelSchema = z.object({
  id: z.string(),
  name: z.enum(['email', 'linkedin', 'phone', 'sms', 'twitter', 'facebook', 'instagram', 'direct_mail', 'webinar', 'event']),
  type: z.enum(['digital', 'social', 'direct', 'event']),
  priority: z.enum(['high', 'medium', 'low']),
  cost: z.object({
    perMessage: z.number(),
    perHour: z.number(),
    currency: z.string().default('USD')
  }),
  capabilities: z.array(z.enum(['personalization', 'automation', 'tracking', 'scheduling', 'ab_testing'])),
  limitations: z.array(z.string()),
  optimalTiming: z.object({
    bestDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
    bestHours: z.object({
      start: z.number().min(0).max(23),
      end: z.number().min(0).max(23)
    }),
    timezone: z.string()
  }),
  performance: z.object({
    averageResponseRate: z.number().min(0).max(1),
    averageConversionRate: z.number().min(0).max(1),
    averageCostPerResponse: z.number(),
    averageTimeToResponse: z.number() // in hours
  }),
  isActive: z.boolean(),
  lastUpdated: z.date()
});

export type OutreachChannel = z.infer<typeof OutreachChannelSchema>;

export const OutreachSequenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  leadSegment: z.object({
    criteria: z.record(z.any()),
    excludeCriteria: z.record(z.any()).optional()
  }),
  channels: z.array(z.object({
    channelId: z.string(),
    stepNumber: z.number().min(1),
    waitCondition: z.object({
      type: z.enum(['time_delay', 'event_triggered', 'response_received', 'no_response']),
      value: z.union([z.number(), z.string(), z.object({})]),
      unit: z.enum(['hours', 'days', 'weeks', 'months']).optional()
    }),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains']),
      value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    })).optional(),
    content: z.object({
      templateId: z.string(),
      personalizationRules: z.array(z.object({
        field: z.string(),
        transformation: z.string(),
        fallback: z.string()
      })),
      attachments: z.array(z.object({
        type: z.string(),
        url: z.string().url(),
        name: z.string()
      }))
    })
  })),
  settings: z.object({
    maxChannels: z.number().min(1).max(10),
    channelPreference: z.enum(['sequential', 'parallel', 'adaptive']),
    retryPolicy: z.object({
      enabled: z.boolean(),
      maxRetries: z.number().min(0).max(5),
      retryInterval: z.object({
        hours: z.number().min(1).max(168),
        multiplier: z.number().min(1).max(3)
      })
    }),
    scheduling: z.object({
      timezone: z.string(),
      businessHours: z.object({
        monday: z.object({ start: z.string(), end: z.string() }),
        tuesday: z.object({ start: z.string(), end: z.string() }),
        wednesday: z.object({ start: z.string(), end: z.string() }),
        thursday: z.object({ start: z.string(), end: z.string() }),
        friday: z.object({ start: z.string(), end: z.string() }),
        saturday: z.object({ start: z.string(), end: z.string() }),
        sunday: z.object({ start: z.string(), end: z.string() })
      }),
      holidays: z.array(z.date())
    }),
    budget: z.object({
      totalBudget: z.number(),
      costPerLead: z.number(),
      currency: z.string().default('USD')
    })
  }),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  performance: z.object({
    totalLeads: z.number().default(0),
    totalContacts: z.number().default(0),
    totalResponses: z.number().default(0),
    totalConversions: z.number().default(0),
    totalCost: z.number().default(0),
    averageCostPerResponse: z.number().default(0),
    averageCostPerConversion: z.number().default(0),
    channelBreakdown: z.record(z.object({
      contacts: z.number(),
      responses: z.number(),
      conversions: z.number(),
      cost: z.number(),
      responseRate: z.number(),
      conversionRate: z.number()
    }))
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastRun: z.date().optional()
});

export type OutreachSequence = z.infer<typeof OutreachSequenceSchema>;

export const OutreachExecutionSchema = z.object({
  id: z.string(),
  sequenceId: z.string(),
  leadId: z.string(),
  executionStatus: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']),
  currentStep: z.number().default(1),
  completedSteps: z.array(z.object({
    stepNumber: z.number(),
    channelId: z.string(),
    executedAt: z.date(),
    status: z.enum(['sent', 'delivered', 'opened', 'clicked', 'replied', 'failed']),
    response: z.object({
      content: z.string(),
      timestamp: z.date(),
      sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
      intent: z.enum(['interested', 'not_interested', 'information_request', 'objection']).optional()
    }).optional(),
    cost: z.number(),
    metadata: z.record(z.any())
  })),
  scheduledSteps: z.array(z.object({
    stepNumber: z.number(),
    channelId: z.string(),
    scheduledFor: z.date(),
    conditions: z.array(z.string())
  })),
  totalCost: z.number().default(0),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  lastActivity: z.date(),
  errorHistory: z.array(z.object({
    timestamp: z.date(),
    stepNumber: z.number(),
    channelId: z.string(),
    errorType: z.string(),
    errorMessage: z.string(),
    retryCount: z.number()
  })),
  metadata: z.object({
    leadScore: z.number(),
    preferredChannels: z.array(z.string()),
    engagementHistory: z.array(z.object({
      channel: z.string(),
      date: z.date(),
      outcome: z.string()
    })),
    timezone: z.string(),
    language: z.string()
  })
});

export type OutreachExecution = z.infer<typeof OutreachExecutionSchema>;

export const ChannelOptimizationSchema = z.object({
  channelId: z.string(),
  period: z.object({
    startDate: z.date(),
    endDate: z.date()
  }),
  metrics: z.object({
    totalMessages: z.number(),
    deliveredMessages: z.number(),
    responses: z.number(),
    positiveResponses: z.number(),
    conversions: z.number(),
    totalCost: z.number(),
    averageResponseTime: z.number(),
    openRate: z.number().min(0).max(1),
    clickRate: z.number().min(0).max(1),
    responseRate: z.number().min(0).max(1),
    conversionRate: z.number().min(0).max(1),
    costPerResponse: z.number(),
    costPerConversion: z.number(),
    roi: z.number()
  }),
  trends: z.array(z.object({
    date: z.date(),
    metric: z.string(),
    value: z.number(),
    change: z.number()
  })),
  recommendations: z.array(z.object({
    type: z.enum(['optimization', 'budget_reallocation', 'timing_adjustment', 'content_improvement']),
    description: z.string(),
    expectedImpact: z.number(),
    priority: z.enum(['high', 'medium', 'low']),
    implementation: z.object({
      steps: z.array(z.string()),
      estimatedTime: z.string(),
      resources: z.array(z.string())
    })
  })),
  benchmarking: z.object({
    industryAverage: z.record(z.number()),
    topPerformer: z.record(z.number()),
    relativePosition: z.enum(['below_average', 'average', 'above_average', 'top_quartile'])
  })
});

export type ChannelOptimization = z.infer<typeof ChannelOptimizationSchema>;

export class OutreachOrchestrationService {
  private channels: Map<string, OutreachChannel> = new Map();
  private sequences: Map<string, OutreachSequence> = new Map();
  private executions: Map<string, OutreachExecution> = new Map();
  private queue: OutreachExecution[] = [];

  constructor() {
    this.initializeDefaultChannels();
    this.startExecutionProcessor();
  }

  createSequence(sequenceData: Omit<OutreachSequence, 'id' | 'createdAt' | 'updatedAt'>): OutreachSequence {
    const sequence: OutreachSequence = {
      id: crypto.randomUUID(),
      ...sequenceData,
      status: 'draft',
      performance: {
        totalLeads: 0,
        totalContacts: 0,
        totalResponses: 0,
        totalConversions: 0,
        totalCost: 0,
        averageCostPerResponse: 0,
        averageCostPerConversion: 0,
        channelBreakdown: {}
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sequences.set(sequence.id, sequence);
    return sequence;
  }

  async executeSequence(sequenceId: string, leads: string[]): Promise<OutreachExecution[]> {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    const executions: OutreachExecution[] = [];
    
    for (const leadId of leads) {
      const execution = await this.createExecution(sequenceId, leadId);
      executions.push(execution);
      this.queue.push(execution);
    }

    sequence.performance.totalLeads += leads.length;
    sequence.lastRun = new Date();

    return executions;
  }

  async addLeadToExecution(executionId: string, stepNumber: number, response?: any): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const sequence = this.sequences.get(execution.sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${execution.sequenceId} not found`);
    }

    const currentStep = sequence.channels.find(ch => ch.stepNumber === stepNumber);
    if (!currentStep) {
      throw new Error(`Step ${stepNumber} not found in sequence`);
    }

    const completedStep = {
      stepNumber,
      channelId: currentStep.channelId,
      executedAt: new Date(),
      status: response ? 'replied' : 'delivered',
      response,
      cost: await this.calculateStepCost(currentStep),
      metadata: {}
    };

    execution.completedSteps.push(completedStep);
    execution.totalCost += completedStep.cost;
    execution.lastActivity = new Date();

    if (response) {
      await this.handleResponse(execution, response, currentStep);
    } else {
      await this.scheduleNextStep(execution, currentStep);
    }

    execution.currentStep = Math.max(execution.currentStep, stepNumber);
    this.updateSequencePerformance(sequence);
  }

  async optimizeChannel(channelId: string, period: { startDate: Date; endDate: Date }): Promise<ChannelOptimization> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const executions = Array.from(this.executions.values()).filter(exec => 
      exec.completedSteps.some(step => step.channelId === channelId) &&
      exec.startTime &&
      exec.startTime >= period.startDate &&
      exec.startTime <= period.endDate
    );

    const metrics = this.calculateChannelMetrics(channelId, executions, period);
    const trends = await this.analyzeChannelTrends(channelId, period);
    const recommendations = await this.generateChannelRecommendations(channel, metrics, trends);
    const benchmarking = await this.benchmarkChannel(channel, metrics);

    return {
      channelId,
      period,
      metrics,
      trends,
      recommendations,
      benchmarking
    };
  }

  async getOptimalChannels(leadId: string, sequenceId: string): Promise<string[]> {
    const execution = this.executions.get(leadId);
    if (!execution) {
      return await this.predictOptimalChannels(leadId);
    }

    const preferredChannels = execution.metadata.preferredChannels;
    const engagementHistory = execution.metadata.engagementHistory;

    return this.rankChannelsByPreference(preferredChannels, engagementHistory);
  }

  async pauseSequence(sequenceId: string, reason?: string): Promise<void> {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    sequence.status = 'paused';
    sequence.updatedAt = new Date();

    const runningExecutions = Array.from(this.executions.values()).filter(
      exec => exec.sequenceId === sequenceId && exec.executionStatus === 'in_progress'
    );

    for (const execution of runningExecutions) {
      execution.executionStatus = 'cancelled';
      await this.cancelScheduledSteps(execution);
    }
  }

  async resumeSequence(sequenceId: string): Promise<void> {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) {
      throw new Error(`Sequence ${sequenceId} not found`);
    }

    if (sequence.status !== 'paused') {
      throw new Error(`Sequence ${sequenceId} is not paused`);
    }

    sequence.status = 'active';
    sequence.updatedAt = new Date();
  }

  private async createExecution(sequenceId: string, leadId: string): Promise<OutreachExecution> {
    const execution: OutreachExecution = {
      id: crypto.randomUUID(),
      sequenceId,
      leadId,
      executionStatus: 'pending',
      currentStep: 1,
      completedSteps: [],
      scheduledSteps: [],
      totalCost: 0,
      lastActivity: new Date(),
      errorHistory: [],
      metadata: {
        leadScore: 75,
        preferredChannels: ['email', 'linkedin'],
        engagementHistory: [],
        timezone: 'America/New_York',
        language: 'en'
      }
    };

    this.executions.set(execution.id, execution);
    return execution;
  }

  private async scheduleNextStep(execution: OutreachExecution, currentStep: any): Promise<void> {
    const sequence = this.sequences.get(execution.sequenceId);
    if (!sequence) return;

    const nextStep = sequence.channels.find(ch => ch.stepNumber === currentStep.stepNumber + 1);
    if (!nextStep) {
      execution.executionStatus = 'completed';
      execution.endTime = new Date();
      return;
    }

    const waitTime = this.calculateWaitTime(currentStep.waitCondition);
    const scheduledFor = new Date(Date.now() + waitTime);

    const scheduledStep = {
      stepNumber: nextStep.stepNumber,
      channelId: nextStep.channelId,
      scheduledFor,
      conditions: nextStep.conditions?.map(cond => JSON.stringify(cond)) || []
    };

    execution.scheduledSteps.push(scheduledStep);
  }

  private async handleResponse(execution: OutreachExecution, response: any, step: any): Promise<void> {
    const sentiment = await this.analyzeSentiment(response.content);
    const intent = await this.analyzeIntent(response.content);

    const processedResponse = {
      ...response,
      timestamp: new Date(),
      sentiment,
      intent
    };

    const lastCompletedStep = execution.completedSteps[execution.completedSteps.length - 1];
    lastCompletedStep.response = processedResponse;

    if (sentiment === 'positive' && intent === 'interested') {
      await this.escalateLead(execution);
    } else if (sentiment === 'negative') {
      await this.handleObjection(execution, response);
    }
  }

  private calculateWaitTime(waitCondition: any): number {
    switch (waitCondition.type) {
      case 'time_delay':
        const value = waitCondition.value;
        const unit = waitCondition.unit || 'hours';
        
        switch (unit) {
          case 'hours': return value * 60 * 60 * 1000;
          case 'days': return value * 24 * 60 * 60 * 1000;
          case 'weeks': return value * 7 * 24 * 60 * 60 * 1000;
          default: return value * 60 * 60 * 1000;
        }
      
      case 'event_triggered':
        return 0;
      
      case 'response_received':
        return 0;
      
      case 'no_response':
        return waitCondition.value * 24 * 60 * 60 * 1000;
      
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  private async calculateStepCost(step: any): Promise<number> {
    const channel = this.channels.get(step.channelId);
    if (!channel) return 0;

    return channel.cost.perMessage;
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'neutral' | 'negative'> {
    const positiveWords = ['interested', 'yes', 'sounds good', 'definitely', 'absolutely'];
    const negativeWords = ['not interested', 'no', 'not now', 'busy', 'wrong time'];
    
    const lowerContent = content.toLowerCase();
    
    for (const word of positiveWords) {
      if (lowerContent.includes(word)) return 'positive';
    }
    
    for (const word of negativeWords) {
      if (lowerContent.includes(word)) return 'negative';
    }
    
    return 'neutral';
  }

  private async analyzeIntent(content: string): Promise<'interested' | 'not_interested' | 'information_request' | 'objection'> {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('tell me more') || lowerContent.includes('how does it work')) {
      return 'information_request';
    }
    
    if (lowerContent.includes('too expensive') || lowerContent.includes('budget')) {
      return 'objection';
    }
    
    if (lowerContent.includes('not interested') || lowerContent.includes('not now')) {
      return 'not_interested';
    }
    
    return 'interested';
  }

  private async escalateLead(execution: OutreachExecution): Promise<void> {
    execution.metadata.preferredChannels = ['phone', 'webinar'];
    
    const sequence = this.sequences.get(execution.sequenceId);
    if (!sequence) return;

    const urgentStep = sequence.channels.find(ch => ch.channelId === 'phone');
    if (urgentStep) {
      const scheduledStep = {
        stepNumber: urgentStep.stepNumber,
        channelId: urgentStep.channelId,
        scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
        conditions: []
      };
      
      execution.scheduledSteps.push(scheduledStep);
    }
  }

  private async handleObjection(execution: OutreachExecution, response: any): Promise<void> {
    execution.errorHistory.push({
      timestamp: new Date(),
      stepNumber: execution.currentStep,
      channelId: execution.completedSteps[execution.completedSteps.length - 1].channelId,
      errorType: 'objection',
      errorMessage: response.content,
      retryCount: 0
    });
  }

  private calculateChannelMetrics(channelId: string, executions: OutreachExecution[], period: any): any {
    const channelExecutions = executions.filter(exec =>
      exec.completedSteps.some(step => step.channelId === channelId)
    );

    const channelSteps = channelExecutions.flatMap(exec =>
      exec.completedSteps.filter(step => step.channelId === channelId)
    );

    const totalMessages = channelSteps.length;
    const responses = channelSteps.filter(step => step.response).length;
    const conversions = channelSteps.filter(step => 
      step.response && step.response.intent === 'interested'
    ).length;
    const totalCost = channelSteps.reduce((sum, step) => sum + step.cost, 0);

    return {
      totalMessages,
      deliveredMessages: totalMessages,
      responses,
      positiveResponses: responses * 0.6,
      conversions,
      totalCost,
      averageResponseTime: 24,
      openRate: 0.4,
      clickRate: 0.1,
      responseRate: totalMessages > 0 ? responses / totalMessages : 0,
      conversionRate: totalMessages > 0 ? conversions / totalMessages : 0,
      costPerResponse: responses > 0 ? totalCost / responses : 0,
      costPerConversion: conversions > 0 ? totalCost / conversions : 0,
      roi: totalCost > 0 ? (conversions * 1000 - totalCost) / totalCost : 0
    };
  }

  private async analyzeChannelTrends(channelId: string, period: any): Promise<any[]> {
    return [
      {
        date: new Date(),
        metric: 'response_rate',
        value: 0.15,
        change: 0.02
      },
      {
        date: new Date(),
        metric: 'conversion_rate',
        value: 0.08,
        change: 0.01
      }
    ];
  }

  private async generateChannelRecommendations(channel: OutreachChannel, metrics: any, trends: any[]): Promise<any[]> {
    const recommendations = [];

    if (metrics.responseRate < 0.1) {
      recommendations.push({
        type: 'content_improvement',
        description: 'Low response rate detected. Consider improving subject lines and personalization.',
        expectedImpact: 0.25,
        priority: 'high',
        implementation: {
          steps: ['A/B test subject lines', 'Add more personalization', 'Test different send times'],
          estimatedTime: '2 weeks',
          resources: ['copywriter', 'marketing analyst']
        }
      });
    }

    if (metrics.conversionRate < 0.05) {
      recommendations.push({
        type: 'timing_adjustment',
        description: 'Consider adjusting send times based on engagement patterns.',
        expectedImpact: 0.15,
        priority: 'medium',
        implementation: {
          steps: ['Analyze best engagement times', 'Update scheduling rules', 'Monitor results'],
          estimatedTime: '1 week',
          resources: ['marketing automation specialist']
        }
      });
    }

    return recommendations;
  }

  private async benchmarkChannel(channel: OutreachChannel, metrics: any): Promise<any> {
    return {
      industryAverage: {
        responseRate: 0.12,
        conversionRate: 0.06,
        costPerResponse: 5.50
      },
      topPerformer: {
        responseRate: 0.25,
        conversionRate: 0.15,
        costPerResponse: 2.75
      },
      relativePosition: metrics.responseRate > 0.12 ? 'above_average' : 'below_average'
    };
  }

  private async predictOptimalChannels(leadId: string): Promise<string[]> {
    return ['email', 'linkedin', 'phone'];
  }

  private rankChannelsByPreference(preferredChannels: string[], engagementHistory: any[]): string[] {
    return preferredChannels.sort((a, b) => {
      const aEngagement = engagementHistory.filter(h => h.channel === a).length;
      const bEngagement = engagementHistory.filter(h => h.channel === b).length;
      return bEngagement - aEngagement;
    });
  }

  private updateSequencePerformance(sequence: OutreachSequence): void {
    const executions = Array.from(this.executions.values()).filter(
      exec => exec.sequenceId === sequence.id
    );

    sequence.performance.totalContacts = executions.reduce((sum, exec) => 
      sum + exec.completedSteps.length, 0
    );
    
    sequence.performance.totalResponses = executions.reduce((sum, exec) => 
      sum + exec.completedSteps.filter(step => step.response).length, 0
    );
    
    sequence.performance.totalConversions = executions.reduce((sum, exec) => 
      sum + exec.completedSteps.filter(step => 
        step.response && step.response.intent === 'interested'
      ).length, 0
    );
  }

  private async cancelScheduledSteps(execution: OutreachExecution): Promise<void> {
    execution.scheduledSteps = [];
    execution.executionStatus = 'cancelled';
  }

  private startExecutionProcessor(): void {
    setInterval(async () => {
      if (this.queue.length === 0) return;

      const execution = this.queue.shift();
      if (!execution) return;

      await this.processExecution(execution);
    }, 5000);
  }

  private async processExecution(execution: OutreachExecution): Promise<void> {
    try {
      execution.executionStatus = 'in_progress';
      execution.startTime = new Date();

      const sequence = this.sequences.get(execution.sequenceId);
      if (!sequence) return;

      const currentStepData = sequence.channels.find(ch => ch.stepNumber === execution.currentStep);
      if (!currentStepData) return;

      const channel = this.channels.get(currentStepData.channelId);
      if (!channel) return;

      await this.executeChannelStep(execution, currentStepData, channel);
      
    } catch (error) {
      execution.errorHistory.push({
        timestamp: new Date(),
        stepNumber: execution.currentStep,
        channelId: '',
        errorType: 'execution_error',
        errorMessage: error.message,
        retryCount: execution.errorHistory.length
      });
      
      execution.executionStatus = 'failed';
    }
  }

  private async executeChannelStep(execution: OutreachExecution, step: any, channel: OutreachChannel): Promise<void> {
    execution.executionStatus = 'in_progress';

    const completedStep = {
      stepNumber: step.stepNumber,
      channelId: channel.id,
      executedAt: new Date(),
      status: 'sent' as const,
      cost: await this.calculateStepCost(step),
      metadata: {}
    };

    execution.completedSteps.push(completedStep);
    execution.totalCost += completedStep.cost;
    execution.lastActivity = new Date();

    await this.scheduleNextStep(execution, step);
  }

  private initializeDefaultChannels(): void {
    const defaultChannels: OutreachChannel[] = [
      {
        id: 'email',
        name: 'email',
        type: 'digital',
        priority: 'high',
        cost: { perMessage: 0.01, perHour: 50, currency: 'USD' },
        capabilities: ['personalization', 'automation', 'tracking', 'scheduling', 'ab_testing'],
        limitations: ['spam_filters', 'inbox_clutter'],
        optimalTiming: {
          bestDays: ['tuesday', 'wednesday', 'thursday'],
          bestHours: { start: 9, end: 16 },
          timezone: 'America/New_York'
        },
        performance: {
          averageResponseRate: 0.15,
          averageConversionRate: 0.08,
          averageCostPerResponse: 0.67,
          averageTimeToResponse: 24
        },
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: 'linkedin',
        name: 'linkedin',
        type: 'social',
        priority: 'medium',
        cost: { perMessage: 0.05, perHour: 75, currency: 'USD' },
        capabilities: ['personalization', 'tracking', 'scheduling'],
        limitations: ['connection_required', 'message_limits'],
        optimalTiming: {
          bestDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          bestHours: { start: 10, end: 15 },
          timezone: 'America/New_York'
        },
        performance: {
          averageResponseRate: 0.25,
          averageConversionRate: 0.12,
          averageCostPerResponse: 0.20,
          averageTimeToResponse: 8
        },
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: 'phone',
        name: 'phone',
        type: 'direct',
        priority: 'high',
        cost: { perMessage: 2.50, perHour: 100, currency: 'USD' },
        capabilities: ['personalization', 'tracking'],
        limitations: ['time_intensive', 'availability_issues'],
        optimalTiming: {
          bestDays: ['tuesday', 'wednesday', 'thursday'],
          bestHours: { start: 10, end: 16 },
          timezone: 'America/New_York'
        },
        performance: {
          averageResponseRate: 0.35,
          averageConversionRate: 0.20,
          averageCostPerResponse: 7.14,
          averageTimeToResponse: 0.1
        },
        isActive: true,
        lastUpdated: new Date()
      }
    ];

    defaultChannels.forEach(channel => this.channels.set(channel.id, channel));
  }

  getChannels(): OutreachChannel[] {
    return Array.from(this.channels.values());
  }

  getSequences(): OutreachSequence[] {
    return Array.from(this.sequences.values());
  }

  getExecutions(): OutreachExecution[] {
    return Array.from(this.executions.values());
  }
}