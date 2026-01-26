import { z } from 'zod';
import { Customer } from './customer-crm';

export const OnboardingTaskSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  taskType: z.enum([
    'account_setup',
    'platform_connection',
    'tracking_implementation',
    'conversion_tracking',
    'api_configuration',
    'user_training',
    'testing_validation',
    'go_live',
    'post_launch_support',
  ]),
  title: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedDuration: z.object({
    hours: z.number().min(0),
    days: z.number().min(0),
  }),
  actualDuration: z.object({
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    hours: z.number().min(0).optional(),
  }),
  assignee: z.string().optional(),
  dependencies: z.array(z.string()),
  deliverables: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['file', 'configuration', 'validation', 'documentation']),
      url: z.string().url().optional(),
      status: z.enum(['pending', 'delivered', 'validated', 'rejected']),
      deliveredAt: z.date().optional(),
    })
  ),
  requirements: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['data', 'access', 'configuration', 'approval']),
      description: z.string(),
      status: z.enum(['pending', 'provided', 'verified', 'rejected']),
      providedBy: z.string().optional(),
      providedAt: z.date().optional(),
    })
  ),
  progress: z.object({
    percentage: z.number().min(0).max(100),
    subtasks: z.array(
      z.object({
        name: z.string(),
        status: z.enum(['pending', 'in_progress', 'completed']),
        percentage: z.number().min(0).max(100),
      })
    ),
    blockers: z.array(
      z.object({
        description: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        reportedAt: z.date(),
        resolvedAt: z.date().optional(),
        resolution: z.string().optional(),
      })
    ),
  }),
  metadata: z.record(z.any()),
  createdAt: z.date(),
  updatedAt: z.date(),
  dueDate: z.date().optional(),
});

export type OnboardingTask = z.infer<typeof OnboardingTaskSchema>;

export const PlatformConnectionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  platform: z.enum(['shopify', 'woocommerce', 'magento', 'bigcommerce', 'custom']),
  platformUrl: z.string().url(),
  platformAccountId: z.string(),
  connectionStatus: z.enum(['not_started', 'in_progress', 'connected', 'failed', 'disconnected']),
  credentials: z.object({
    type: z.enum(['api_key', 'oauth', 'webhook', 'manual']),
    status: z.enum(['pending', 'provided', 'verified', 'expired', 'revoked']),
    lastVerified: z.date().optional(),
    expiresAt: z.date().optional(),
  }),
  capabilities: z.array(
    z.object({
      name: z.string(),
      available: z.boolean(),
      configured: z.boolean(),
      tested: z.boolean(),
      limitations: z.array(z.string()),
    })
  ),
  tracking: z.object({
    eventsTracked: z.array(z.string()),
    conversionActions: z.array(z.string()),
    revenueTracking: z.boolean(),
    customEvents: z.array(
      z.object({
        name: z.string(),
        parameters: z.array(z.string()),
        enabled: z.boolean(),
      })
    ),
  }),
  integration: z.object({
    apiAccess: z.boolean(),
    webhookConfigured: z.boolean(),
    dataSync: z.enum(['real_time', 'hourly', 'daily', 'manual']),
    lastSync: z.date().optional(),
    syncErrors: z.array(
      z.object({
        error: z.string(),
        timestamp: z.date(),
        resolved: z.boolean(),
      })
    ),
  }),
  performance: z.object({
    dataQuality: z.object({
      completeness: z.number().min(0).max(1),
      accuracy: z.number().min(0).max(1),
      timeliness: z.number().min(0).max(1),
      lastChecked: z.date(),
    }),
    uptime: z.number().min(0).max(1),
    responseTime: z.number(),
    errorRate: z.number().min(0).max(1),
  }),
  lastUpdated: z.date(),
});

export type PlatformConnection = z.infer<typeof PlatformConnectionSchema>;

export const OnboardingChecklistSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  category: z.enum([
    'pre_setup',
    'technical_setup',
    'configuration',
    'testing',
    'training',
    'go_live',
  ]),
  title: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      required: z.boolean(),
      status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
      assignee: z.string().optional(),
      notes: z.string().optional(),
      completedAt: z.date().optional(),
      verification: z.object({
        method: z.enum(['automated', 'manual', 'user_confirmation']),
        result: z.enum(['pass', 'fail', 'pending']),
        verifiedAt: z.date().optional(),
        verifiedBy: z.string().optional(),
      }),
    })
  ),
  overallProgress: z.object({
    totalItems: z.number(),
    completedItems: z.number(),
    percentage: z.number().min(0).max(100),
    blockedBy: z.array(z.string()),
  }),
  estimatedCompletion: z.date().optional(),
  actualCompletion: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OnboardingChecklist = z.infer<typeof OnboardingChecklistSchema>;

export const OnboardingWorkflowSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  workflowName: z.string(),
  workflowType: z.enum(['standard', 'expedited', 'enterprise', 'migration']),
  stages: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      order: z.number().min(1),
      status: z.enum(['not_started', 'in_progress', 'completed', 'failed']),
      estimatedDuration: z.object({
        days: z.number().min(0),
        businessDays: z.boolean().default(true),
      }),
      actualDuration: z.object({
        startedAt: z.date().optional(),
        completedAt: z.date().optional(),
        days: z.number().optional(),
      }),
      tasks: z.array(z.string()),
      gates: z.array(
        z.object({
          type: z.enum(['approval', 'validation', 'payment', 'documentation']),
          name: z.string(),
          required: z.boolean(),
          status: z.enum(['pending', 'passed', 'failed', 'waived']),
          completedAt: z.date().optional(),
          notes: z.string().optional(),
        })
      ),
    })
  ),
  settings: z.object({
    autoProgress: z.boolean(),
    skipOptional: z.boolean(),
    parallelTasks: z.boolean(),
    notifications: z.object({
      customer: z.boolean(),
      internal: z.boolean(),
      milestones: z.boolean(),
    }),
  }),
  metrics: z.object({
    totalTasks: z.number(),
    completedTasks: z.number(),
    failedTasks: z.number(),
    averageTaskDuration: z.number(),
    onTimeCompletion: z.number().min(0).max(1),
    customerSatisfaction: z.number().min(1).max(5),
  }),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  estimatedCompletion: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OnboardingWorkflow = z.infer<typeof OnboardingWorkflowSchema>;

export const OnboardingProgressSchema = z.object({
  customerId: z.string(),
  overallProgress: z.object({
    percentage: z.number().min(0).max(100),
    currentStage: z.string(),
    completedStages: z.array(z.string()),
    remainingDays: z.number(),
    status: z.enum(['on_track', 'at_risk', 'delayed', 'completed']),
  }),
  taskBreakdown: z.record(
    z.object({
      total: z.number(),
      completed: z.number(),
      failed: z.number(),
      inProgress: z.number(),
    })
  ),
  milestoneProgress: z.array(
    z.object({
      milestone: z.string(),
      dueDate: z.date(),
      status: z.enum(['upcoming', 'due', 'overdue', 'completed']),
      completionDate: z.date().optional(),
    })
  ),
  riskFactors: z.array(
    z.object({
      risk: z.string(),
      probability: z.enum(['low', 'medium', 'high']),
      impact: z.enum(['low', 'medium', 'high']),
      mitigation: z.string(),
      owner: z.string(),
      status: z.enum(['identified', 'monitoring', 'mitigated', 'accepted']),
    })
  ),
  qualityMetrics: z.object({
    customerSatisfaction: z.number().min(1).max(5),
    technicalQuality: z.number().min(0).max(1),
    documentationQuality: z.number().min(0).max(1),
    timeliness: z.number().min(0).max(1),
    firstCallResolution: z.number().min(0).max(1),
  }),
  lastUpdated: z.date(),
});

export type OnboardingProgress = z.infer<typeof OnboardingProgressSchema>;

export class AdsEngineerOnboardingService {
  private workflows: Map<string, OnboardingWorkflow> = new Map();
  private tasks: Map<string, OnboardingTask> = new Map();
  private checklists: Map<string, OnboardingChecklist> = new Map();
  private connections: Map<string, PlatformConnection> = new Map();

  constructor() {
    this.initializeWorkflows();
  }

  async initiateOnboarding(
    customer: Customer,
    workflowType: OnboardingWorkflow['workflowType'] = 'standard'
  ): Promise<OnboardingWorkflow> {
    const workflow = this.createWorkflow(customer, workflowType);

    this.workflows.set(workflow.id, workflow);

    await this.generateChecklist(customer.id, workflow.id);
    await this.createInitialTasks(customer, workflow);

    workflow.status = 'active';
    workflow.startDate = new Date();
    workflow.estimatedCompletion = this.calculateEstimatedCompletion(workflow);

    this.updateWorkflow(workflow);

    await this.sendWelcomeNotification(customer, workflow);

    return workflow;
  }

  async configurePlatform(
    customer: Customer,
    platform: PlatformConnection['platform'],
    credentials: any
  ): Promise<PlatformConnection> {
    const connection = this.createPlatformConnection(customer.id, platform, credentials);

    try {
      await this.validatePlatformConnection(connection);
      connection.connectionStatus = 'connected';
      connection.integration.apiAccess = true;
      connection.integration.webhookConfigured = true;

      await this.configureTracking(connection);
      connection.tracking.eventsTracked = await this.getSupportedEvents(platform);
    } catch (error) {
      connection.connectionStatus = 'failed';
      throw new Error(`Platform connection failed: ${error.message}`);
    }

    this.connections.set(connection.id, connection);

    const task = await this.updateTaskStatus(customer.id, 'platform_connection', 'completed');

    await this.triggerNextTasks(customer.id, task.id);

    return connection;
  }

  async implementTracking(customer: Customer, trackingConfig: any): Promise<OnboardingTask> {
    const task = this.tasks
      .values()
      .find((t) => t.customerId === customer.id && t.taskType === 'tracking_implementation');

    if (!task) {
      throw new Error('Tracking implementation task not found');
    }

    task.status = 'in_progress';
    task.actualDuration.startedAt = new Date();

    try {
      await this.setupConversionTracking(customer, trackingConfig);
      await this.configureCustomEvents(customer, trackingConfig.customEvents || []);
      await this.validateTrackingData(customer);

      task.status = 'completed';
      task.actualDuration.completedAt = new Date();
      task.actualDuration.hours = this.calculateTaskDuration(task);

      task.deliverables = [
        {
          name: 'Conversion Tracking Setup',
          type: 'configuration',
          status: 'validated',
        },
        {
          name: 'Custom Events Configuration',
          type: 'configuration',
          status: 'validated',
        },
      ];
    } catch (error) {
      task.status = 'failed';
      task.progress.blockers.push({
        description: `Tracking implementation failed: ${error.message}`,
        severity: 'high',
        reportedAt: new Date(),
      });
    }

    this.tasks.set(task.id, task);
    await this.triggerNextTasks(customer.id, task.id);

    return task;
  }

  async completeOnboarding(customer: Customer): Promise<void> {
    const workflow = Array.from(this.workflows.values()).find((w) => w.customerId === customer.id);
    if (!workflow) {
      throw new Error('Onboarding workflow not found');
    }

    workflow.status = 'completed';
    workflow.endDate = new Date();

    const finalMetrics = this.calculateFinalMetrics(customer.id);
    workflow.metrics = finalMetrics;

    this.workflows.set(workflow.id, workflow);

    await this.sendCompletionNotifications(customer, workflow);
    await this.transitionToSupport(customer);

    const checklist = this.checklists.get(customer.id);
    if (checklist) {
      checklist.overallProgress.percentage = 100;
      checklist.actualCompletion = new Date();
      this.checklists.set(checklist.id, checklist);
    }
  }

  async generateOnboardingReport(customerId: string): Promise<any> {
    const workflow = Array.from(this.workflows.values()).find((w) => w.customerId === customerId);
    const tasks = Array.from(this.tasks.values()).filter((t) => t.customerId === customerId);
    const connections = Array.from(this.connections.values()).filter(
      (c) => c.customerId === customerId
    );
    const checklist = this.checklists.get(customerId);

    return {
      customer: customerId,
      workflow,
      tasks: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        failed: tasks.filter((t) => t.status === 'failed').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        breakdown: this.categorizeTasks(tasks),
      },
      connections: {
        total: connections.length,
        active: connections.filter((c) => c.connectionStatus === 'connected').length,
        platforms: connections.map((c) => c.platform),
      },
      checklist,
      progress: await this.calculateProgress(customerId),
      quality: await this.calculateQualityMetrics(customerId),
      timeline: this.generateTimeline(workflow, tasks),
      recommendations: await this.generateRecommendations(customerId),
    };
  }

  private createWorkflow(
    customer: Customer,
    workflowType: OnboardingWorkflow['workflowType']
  ): OnboardingWorkflow {
    return {
      id: crypto.randomUUID(),
      customerId: customer.id,
      workflowName: `${customer.businessInfo.industry} Onboarding`,
      workflowType,
      stages: this.generateWorkflowStages(customer, workflowType),
      settings: {
        autoProgress: true,
        skipOptional: false,
        parallelTasks: true,
        notifications: {
          customer: true,
          internal: true,
          milestones: true,
        },
      },
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskDuration: 0,
        onTimeCompletion: 1.0,
        customerSatisfaction: 5.0,
      },
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private generateWorkflowStages(
    customer: Customer,
    workflowType: OnboardingWorkflow['workflowType']
  ) {
    const baseStages = [
      {
        id: 'pre_setup',
        name: 'Pre-Setup',
        description: 'Gather requirements and prepare account',
        order: 1,
        status: 'not_started',
        estimatedDuration: { days: 1, businessDays: true },
        tasks: ['account_setup'],
        gates: [],
      },
      {
        id: 'technical_setup',
        name: 'Technical Setup',
        description: 'Configure platform connections and tracking',
        order: 2,
        status: 'not_started',
        estimatedDuration: { days: 3, businessDays: true },
        tasks: ['platform_connection', 'tracking_implementation'],
        gates: [
          { type: 'validation', name: 'Platform Connection', required: true, status: 'pending' },
        ],
      },
      {
        id: 'configuration',
        name: 'Configuration',
        description: 'Configure conversion tracking and custom events',
        order: 3,
        status: 'not_started',
        estimatedDuration: { days: 2, businessDays: true },
        tasks: ['conversion_tracking', 'api_configuration'],
        gates: [],
      },
      {
        id: 'testing',
        name: 'Testing & Validation',
        description: 'Test tracking and validate data flow',
        order: 4,
        status: 'not_started',
        estimatedDuration: { days: 2, businessDays: true },
        tasks: ['testing_validation'],
        gates: [
          { type: 'validation', name: 'Data Quality Check', required: true, status: 'pending' },
        ],
      },
      {
        id: 'training',
        name: 'Training',
        description: 'Train customer on platform usage',
        order: 5,
        status: 'not_started',
        estimatedDuration: { days: 1, businessDays: true },
        tasks: ['user_training'],
        gates: [],
      },
      {
        id: 'go_live',
        name: 'Go Live',
        description: 'Launch tracking and begin data collection',
        order: 6,
        status: 'not_started',
        estimatedDuration: { days: 1, businessDays: true },
        tasks: ['go_live'],
        gates: [{ type: 'approval', name: 'Customer Approval', required: true, status: 'pending' }],
      },
    ];

    if (workflowType === 'expedited') {
      baseStages.forEach((stage) => {
        stage.estimatedDuration.days = Math.ceil(stage.estimatedDuration.days * 0.7);
      });
    }

    if (workflowType === 'enterprise') {
      baseStages.push({
        id: 'post_launch_support',
        name: 'Post-Launch Support',
        description: 'Extended support and optimization',
        order: 7,
        status: 'not_started',
        estimatedDuration: { days: 7, businessDays: true },
        tasks: ['post_launch_support'],
        gates: [],
      });
    }

    return baseStages;
  }

  private createPlatformConnection(
    customerId: string,
    platform: string,
    credentials: any
  ): PlatformConnection {
    return {
      id: crypto.randomUUID(),
      customerId,
      platform,
      platformUrl: credentials.url || '',
      platformAccountId: credentials.accountId || '',
      connectionStatus: 'not_started',
      credentials: {
        type: credentials.type || 'api_key',
        status: 'pending',
        expiresAt: credentials.expiresAt,
      },
      capabilities: [],
      tracking: {
        eventsTracked: [],
        conversionActions: [],
        revenueTracking: false,
        customEvents: [],
      },
      integration: {
        apiAccess: false,
        webhookConfigured: false,
        dataSync: 'manual',
        syncErrors: [],
      },
      performance: {
        dataQuality: {
          completeness: 0,
          accuracy: 0,
          timeliness: 0,
          lastChecked: new Date(),
        },
        uptime: 0,
        responseTime: 0,
        errorRate: 0,
      },
      lastUpdated: new Date(),
    };
  }

  private async generateChecklist(customerId: string, workflowId: string): Promise<void> {
    const checklist: OnboardingChecklist = {
      id: crypto.randomUUID(),
      customerId,
      category: 'pre_setup',
      title: 'Onboarding Checklist',
      items: [
        {
          id: 'account_review',
          title: 'Account Information Review',
          description: 'Review and confirm customer account details',
          required: true,
          status: 'pending',
        },
        {
          id: 'platform_access',
          title: 'Platform Access Credentials',
          description: 'Obtain platform access credentials',
          required: true,
          status: 'pending',
        },
        {
          id: 'technical_requirements',
          title: 'Technical Requirements Check',
          description: 'Verify technical requirements and compatibility',
          required: true,
          status: 'pending',
        },
      ],
      overallProgress: {
        totalItems: 3,
        completedItems: 0,
        percentage: 0,
        blockedBy: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.checklists.set(checklist.id, checklist);
  }

  private async createInitialTasks(
    customer: Customer,
    workflow: OnboardingWorkflow
  ): Promise<void> {
    const initialTasks: Omit<OnboardingTask, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        customerId: customer.id,
        taskType: 'account_setup',
        title: 'Account Setup',
        description: 'Set up customer account and initial configuration',
        status: 'pending',
        priority: 'high',
        estimatedDuration: { hours: 2, days: 0 },
        dependencies: [],
        deliverables: [],
        requirements: [],
        progress: {
          percentage: 0,
          subtasks: [],
          blockers: [],
        },
        metadata: {},
      },
      {
        customerId: customer.id,
        taskType: 'platform_connection',
        title: 'Platform Connection',
        description: `Connect to ${customer.businessInfo.techStack.platforms[0]} platform`,
        status: 'pending',
        priority: 'high',
        estimatedDuration: { hours: 4, days: 0 },
        dependencies: ['account_setup'],
        deliverables: [],
        requirements: [],
        progress: {
          percentage: 0,
          subtasks: [],
          blockers: [],
        },
        metadata: {},
      },
    ];

    for (const taskData of initialTasks) {
      const task: OnboardingTask = {
        id: crypto.randomUUID(),
        ...taskData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.tasks.set(task.id, task);
    }

    workflow.metrics.totalTasks = initialTasks.length;
    this.updateWorkflow(workflow);
  }

  private async validatePlatformConnection(connection: PlatformConnection): Promise<void> {
    const validationPromises = [
      this.testApiConnection(connection),
      this.testWebhookConnection(connection),
      this.testDataSync(connection),
    ];

    await Promise.all(validationPromises);
  }

  private async testApiConnection(connection: PlatformConnection): Promise<void> {
    if (connection.platform === 'shopify') {
      const testUrl = `https://${connection.platformUrl}/admin/api/2023-01/shop.json`;
      const response = await fetch(testUrl);

      if (!response.ok) {
        throw new Error('API connection test failed');
      }
    }
  }

  private async testWebhookConnection(connection: PlatformConnection): Promise<void> {
    connection.integration.webhookConfigured = true;
  }

  private async testDataSync(connection: PlatformConnection): Promise<void> {
    connection.integration.dataSync = 'real_time';
    connection.integration.lastSync = new Date();
  }

  private async configureTracking(connection: PlatformConnection): Promise<void> {
    connection.tracking.eventsTracked = ['page_view', 'add_to_cart', 'purchase'];
    connection.tracking.conversionActions = ['purchase', 'checkout_complete'];
    connection.tracking.revenueTracking = true;
  }

  private async getSupportedEvents(platform: string): Promise<string[]> {
    const eventMap: Record<string, string[]> = {
      shopify: ['page_view', 'add_to_cart', 'purchase', 'checkout_complete', 'refund'],
      woocommerce: ['page_view', 'add_to_cart', 'purchase', 'checkout_complete'],
      magento: ['page_view', 'add_to_cart', 'purchase', 'checkout_complete'],
      bigcommerce: ['page_view', 'add_to_cart', 'purchase', 'checkout_complete'],
      custom: ['page_view', 'add_to_cart', 'purchase', 'checkout_complete', 'custom_event'],
    };

    return eventMap[platform] || eventMap['custom'];
  }

  private calculateEstimatedCompletion(workflow: OnboardingWorkflow): Date {
    const totalDays = workflow.stages.reduce((sum, stage) => sum + stage.estimatedDuration.days, 0);
    return new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000);
  }

  private async sendWelcomeNotification(
    customer: Customer,
    workflow: OnboardingWorkflow
  ): Promise<void> {}

  private async updateTaskStatus(
    customerId: string,
    taskType: string,
    status: OnboardingTask['status']
  ): Promise<OnboardingTask> {
    const task = Array.from(this.tasks.values()).find(
      (t) => t.customerId === customerId && t.taskType === taskType
    );

    if (!task) {
      throw new Error(`Task ${taskType} not found for customer ${customerId}`);
    }

    task.status = status;
    if (status === 'completed') {
      task.actualDuration.completedAt = new Date();
      task.actualDuration.hours = this.calculateTaskDuration(task);
    }

    this.tasks.set(task.id, task);
    return task;
  }

  private async triggerNextTasks(customerId: string, completedTaskId: string): Promise<void> {
    const customer = await this.getCustomer(customerId);
    const tasks = Array.from(this.tasks.values()).filter((t) => t.customerId === customerId);

    const completedTask = tasks.find((t) => t.id === completedTaskId);
    if (!completedTask) return;

    const dependentTasks = tasks.filter(
      (t) => t.dependencies.includes(completedTaskId) && t.status === 'pending'
    );

    for (const task of dependentTasks) {
      if (this.allDependenciesMet(task, tasks)) {
        task.status = 'in_progress';
        task.actualDuration.startedAt = new Date();
        this.tasks.set(task.id, task);
      }
    }
  }

  private allDependenciesMet(task: OnboardingTask, allTasks: OnboardingTask[]): boolean {
    return task.dependencies.every((depId) => {
      const depTask = allTasks.find((t) => t.id === depId);
      return depTask && depTask.status === 'completed';
    });
  }

  private calculateTaskDuration(task: OnboardingTask): number {
    if (task.actualDuration.startedAt && task.actualDuration.completedAt) {
      const durationMs =
        task.actualDuration.completedAt.getTime() - task.actualDuration.startedAt.getTime();
      return durationMs / (1000 * 60 * 60);
    }
    return 0;
  }

  private async calculateProgress(customerId: string): Promise<OnboardingProgress> {
    const workflow = Array.from(this.workflows.values()).find((w) => w.customerId === customerId);
    const tasks = Array.from(this.tasks.values()).filter((t) => t.customerId === customerId);

    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const completedStages = workflow.stages
      .filter((stage) => stage.status === 'completed')
      .map((stage) => stage.id);

    const currentStage = workflow.stages.find((stage) => stage.status === 'in_progress');

    return {
      customerId,
      overallProgress: {
        percentage: this.calculateOverallProgress(workflow, tasks),
        currentStage: currentStage?.id || '',
        completedStages,
        remainingDays: this.calculateRemainingDays(workflow),
        status: this.determineProgressStatus(workflow, tasks),
      },
      taskBreakdown: this.categorizeTasks(tasks),
      milestoneProgress: this.calculateMilestoneProgress(workflow),
      riskFactors: [],
      qualityMetrics: {
        customerSatisfaction: 4.5,
        technicalQuality: 0.9,
        documentationQuality: 0.8,
        timeliness: 0.85,
        firstCallResolution: 0.7,
      },
      lastUpdated: new Date(),
    };
  }

  private calculateOverallProgress(workflow: OnboardingWorkflow, tasks: OnboardingTask[]): number {
    const totalTasks = workflow.metrics.totalTasks;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  private calculateRemainingDays(workflow: OnboardingWorkflow): number {
    if (workflow.estimatedCompletion) {
      const remainingMs = workflow.estimatedCompletion.getTime() - Date.now();
      return Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
    }
    return 0;
  }

  private determineProgressStatus(
    workflow: OnboardingWorkflow,
    tasks: OnboardingTask[]
  ): 'on_track' | 'at_risk' | 'delayed' | 'completed' {
    if (workflow.status === 'completed') return 'completed';

    const overallProgress = this.calculateOverallProgress(workflow, tasks);
    const expectedProgress = this.calculateExpectedProgress(workflow);

    if (overallProgress < expectedProgress - 20) return 'delayed';
    if (overallProgress < expectedProgress - 10) return 'at_risk';
    return 'on_track';
  }

  private calculateExpectedProgress(workflow: OnboardingWorkflow): number {
    if (!workflow.startDate) return 0;

    const elapsedMs = Date.now() - workflow.startDate.getTime();
    const totalMs = workflow.estimatedCompletion.getTime() - workflow.startDate.getTime();

    return Math.round((elapsedMs / totalMs) * 100);
  }

  private categorizeTasks(tasks: OnboardingTask[]): Record<string, any> {
    const categories = [
      'account_setup',
      'platform_connection',
      'tracking_implementation',
      'configuration',
      'testing',
    ];

    return categories.reduce((acc, category) => {
      const categoryTasks = tasks.filter((t) => t.taskType === category);
      acc[category] = {
        total: categoryTasks.length,
        completed: categoryTasks.filter((t) => t.status === 'completed').length,
        failed: categoryTasks.filter((t) => t.status === 'failed').length,
        inProgress: categoryTasks.filter((t) => t.status === 'in_progress').length,
      };
      return acc;
    }, {});
  }

  private calculateMilestoneProgress(workflow: OnboardingWorkflow[]) {
    return [
      {
        milestone: 'Platform Connected',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
      },
      {
        milestone: 'Tracking Live',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
      },
    ];
  }

  private async sendCompletionNotifications(
    customer: Customer,
    workflow: OnboardingWorkflow
  ): Promise<void> {}

  private async transitionToSupport(customer: Customer): Promise<void> {}

  private async calculateFinalMetrics(customerId: string): Promise<any> {
    const tasks = Array.from(this.tasks.values()).filter((t) => t.customerId === customerId);

    const completedTasks = tasks.filter((t) => t.status === 'completed');
    const failedTasks = tasks.filter((t) => t.status === 'failed');

    const durations = completedTasks
      .map((t) => t.actualDuration.hours)
      .filter((duration) => duration && duration > 0);

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      averageTaskDuration:
        durations.length > 0
          ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
          : 0,
      onTimeCompletion: this.calculateOnTimeCompletion(completedTasks),
      customerSatisfaction: 4.7,
    };
  }

  private calculateOnTimeCompletion(completedTasks: OnboardingTask[]): number {
    if (completedTasks.length === 0) return 1.0;

    const onTimeTasks = completedTasks.filter((task) => {
      if (!task.estimatedDuration || !task.actualDuration.completedAt) return true;

      const estimatedMs = task.estimatedDuration.hours * 60 * 60 * 1000;
      const actualMs =
        task.actualDuration.completedAt.getTime() - task.actualDuration.startedAt.getTime();

      return actualMs <= estimatedMs * 1.2;
    });

    return onTimeTasks.length / completedTasks.length;
  }

  private generateTimeline(workflow: OnboardingWorkflow, tasks: OnboardingTask[]): any[] {
    return tasks
      .filter((task) => task.actualDuration.startedAt)
      .map((task) => ({
        taskId: task.id,
        taskType: task.taskType,
        title: task.title,
        status: task.status,
        startedAt: task.actualDuration.startedAt,
        completedAt: task.actualDuration.completedAt,
        duration: task.actualDuration.hours,
        assignee: task.assignee,
      }))
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }

  private async generateRecommendations(customerId: string): Promise<string[]> {
    const recommendations = [];

    const tasks = Array.from(this.tasks.values()).filter((t) => t.customerId === customerId);
    const hasFailedTasks = tasks.some((t) => t.status === 'failed');

    if (hasFailedTasks) {
      recommendations.push('Schedule follow-up to address failed implementation tasks');
    }

    const connections = Array.from(this.connections.values()).filter(
      (c) => c.customerId === customerId
    );
    const hasConnectionIssues = connections.some((c) => c.connectionStatus !== 'connected');

    if (hasConnectionIssues) {
      recommendations.push('Review and fix platform connection issues');
    }

    recommendations.push('Schedule post-onboarding review call');
    recommendations.push('Provide customer training materials');

    return recommendations;
  }

  private async getCustomer(customerId: string): Promise<Customer> {
    return {} as Customer;
  }

  private updateWorkflow(workflow: OnboardingWorkflow): void {
    workflow.updatedAt = new Date();
    this.workflows.set(workflow.id, workflow);
  }

  private async setupConversionTracking(customer: Customer, config: any): Promise<void> {}

  private async configureCustomEvents(customer: Customer, events: any[]): Promise<void> {}

  private async validateTrackingData(customer: Customer): Promise<void> {}

  private async calculateQualityMetrics(customerId: string): Promise<any> {
    return {
      customerSatisfaction: 4.5,
      technicalQuality: 0.92,
      documentationQuality: 0.88,
      timeliness: 0.95,
      firstCallResolution: 0.78,
    };
  }

  private initializeWorkflows(): void {}

  getWorkflows(): OnboardingWorkflow[] {
    return Array.from(this.workflows.values());
  }

  getTasks(): OnboardingTask[] {
    return Array.from(this.tasks.values());
  }

  getConnections(): PlatformConnection[] {
    return Array.from(this.connections.values());
  }

  getOnboardingProgress(customerId: string): OnboardingProgress | undefined {
    const progress = Array.from(this.values()).find((p) => p.customerId === customerId);
    return progress;
  }
}
