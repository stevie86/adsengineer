import { z } from 'zod';

export const LinkedInProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  headline: z.string(),
  location: z.object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
  }),
  industry: z.string(),
  summary: z.string().optional(),
  profileUrl: z.string().url(),
  profileImageUrl: z.string().url().optional(),
  currentCompany: z.object({
    name: z.string(),
    industry: z.string(),
    size: z.string(),
    website: z.string().url().optional(),
    type: z.enum(['public_company', 'private_company', 'nonprofit', 'government', 'self_employed']),
    founded: z.number().optional(),
    headquarters: z.object({
      country: z.string(),
      region: z.string(),
      city: z.string(),
    }),
  }),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      industry: z.string(),
      location: z.object({
        country: z.string(),
        region: z.string(),
        city: z.string(),
      }),
      startDate: z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      }),
      endDate: z
        .object({
          month: z.number().min(1).max(12),
          year: z.number(),
        })
        .optional(),
      isCurrent: z.boolean(),
      description: z.string().optional(),
    })
  ),
  education: z.array(
    z.object({
      schoolName: z.string(),
      degree: z.string(),
      fieldOfStudy: z.string(),
      startDate: z.object({
        year: z.number(),
      }),
      endDate: z
        .object({
          year: z.number(),
        })
        .optional(),
      activities: z.array(z.string()).optional(),
    })
  ),
  skills: z.array(
    z.object({
      name: z.string(),
      endorsements: z.number().optional(),
    })
  ),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        authority: z.string(),
        url: z.string().url().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .optional(),
  languages: z.array(
    z.object({
      name: z.string(),
      proficiency: z.enum([
        'elementary',
        'limited_working',
        'professional_working',
        'full_professional',
        'native',
      ]),
    })
  ),
  connections: z.object({
    total: z.number(),
    connections: z.number(),
    followers: z.number().optional(),
  }),
  lastUpdated: z.date(),
  dataSources: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
});

export type LinkedInProfile = z.infer<typeof LinkedInProfileSchema>;

export const SalesNavigatorLeadSchema = z.object({
  id: z.string(),
  profile: LinkedInProfileSchema,
  leadScore: z.number().min(0).max(100),
  buyingSignals: z.array(
    z.object({
      type: z.enum([
        'job_change',
        'promotion',
        'company_expansion',
        'funding',
        'new_hiring',
        'technology_adoption',
      ]),
      signal: z.string(),
      detectedAt: z.date(),
      confidence: z.number().min(0).max(1),
      impact: z.enum(['low', 'medium', 'high']),
    })
  ),
  accountInsights: z.object({
    accountTier: z.enum(['high_growth', 'enterprise', 'mid_market', 'small_business']),
    relationshipStrength: z.enum(['strong', 'moderate', 'weak']),
    accountHealth: z.enum(['excellent', 'good', 'neutral', 'at_risk', 'declining']),
    buyingStage: z.enum([
      'awareness',
      'interest',
      'consideration',
      'intent',
      'purchase',
      'retention',
    ]),
    decisionMakerLevel: z.enum(['c_suite', 'vp', 'director', 'manager', 'individual_contributor']),
    budgetAuthority: z.enum(['full', 'partial', 'influencer', 'no_authority']),
    timeline: z.enum(['immediate', '30_days', '90_days', '6_months', '12_months', 'unknown']),
    competitorRelationships: z.array(
      z.object({
        company: z.string(),
        strength: z.enum(['strong', 'moderate', 'weak']),
        lastContact: z.date(),
      })
    ),
  }),
  engagementOpportunities: z.array(
    z.object({
      type: z.enum([
        'shared_connection',
        'alumni',
        'former_colleague',
        'shared_group',
        'recent_post',
        'company_announcement',
      ]),
      description: z.string(),
      relevance: z.number().min(0).max(1),
      suggestedAction: z.string(),
    })
  ),
  contactPreferences: z.object({
    preferredChannel: z.enum(['email', 'linkedin_message', 'phone', 'referral']),
    bestContactTime: z.object({
      dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
      timeRange: z.string(),
    }),
    responseHistory: z.array(
      z.object({
        channel: z.string(),
        date: z.date(),
        responseTime: z.number(),
        outcome: z.enum(['positive', 'neutral', 'negative', 'no_response']),
      })
    ),
  }),
  enrichmentData: z.object({
    companyData: z.object({
      description: z.string(),
      specialties: z.array(z.string()),
      industryRankings: z.record(z.number()),
      recentNews: z.array(
        z.object({
          title: z.string(),
          source: z.string(),
          url: z.string().url(),
          publishedAt: z.date(),
          sentiment: z.enum(['positive', 'neutral', 'negative']),
        })
      ),
      fundingHistory: z.array(
        z.object({
          round: z.string(),
          amount: z.number(),
          date: z.date(),
          investors: z.array(z.string()),
        })
      ),
      technologyStack: z.array(z.string()),
    }),
    marketContext: z.object({
      industryTrends: z.array(
        z.object({
          trend: z.string(),
          impact: z.enum(['positive', 'negative', 'neutral']),
          timeframe: z.enum(['short_term', 'medium_term', 'long_term']),
        })
      ),
      competitorActivity: z.array(
        z.object({
          competitor: z.string(),
          activity: z.string(),
          impact: z.enum(['low', 'medium', 'high']),
          date: z.date(),
        })
      ),
      economicIndicators: z.array(
        z.object({
          indicator: z.string(),
          value: z.string(),
          impact: z.enum(['positive', 'negative', 'neutral']),
          industry: z.string(),
        })
      ),
    }),
  }),
  lastEnriched: z.date(),
  nextReviewDate: z.date(),
});

export type SalesNavigatorLead = z.infer<typeof SalesNavigatorLeadSchema>;

export const LinkedInSearchCriteriaSchema = z.object({
  keywords: z.array(z.string()),
  industries: z.array(z.string()),
  locations: z.array(
    z.object({
      country: z.string(),
      region: z.string(),
      city: z.string(),
      includeNearby: z.boolean().default(true),
    })
  ),
  companySizes: z.array(
    z.enum([
      '1',
      '2-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5001-10000',
      '10001+',
    ])
  ),
  seniority: z.array(
    z.enum(['unspecified', 'owner', 'partner', 'cxo', 'vp', 'director', 'manager', 'senior'])
  ),
  functions: z.array(z.string()),
  currentCompany: z.array(z.string()),
  pastCompany: z.array(z.string()),
  connectionsOf: z.string().optional(),
  excludeKeywords: z.array(z.string()).optional(),
  openToWork: z.boolean().optional(),
  postedWithinLast30Days: z.boolean().optional(),
});

export type LinkedInSearchCriteria = z.infer<typeof LinkedInSearchCriteriaSchema>;

export const LinkedInSearchResultSchema = z.object({
  profiles: z.array(LinkedInProfileSchema),
  totalResults: z.number(),
  searchCriteria: LinkedInSearchCriteriaSchema,
  pagination: z.object({
    start: z.number(),
    count: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  }),
  searchId: z.string(),
  searchedAt: z.date(),
  processingTime: z.number(),
});

export type LinkedInSearchResult = z.infer<typeof LinkedInSearchResultSchema>;

export class LinkedInSalesNavigatorService {
  private accessToken: string;
  private apiBaseUrl = 'https://api.linkedin.com/v2';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async searchLeads(criteria: LinkedInSearchCriteria): Promise<LinkedInSearchResult> {
    const searchRequest = this.buildSearchRequest(criteria);

    try {
      const response = await this.makeAuthenticatedRequest('/salesNavigator/search', {
        method: 'POST',
        body: JSON.stringify(searchRequest),
      });

      const profiles = await this.enrichSearchResults(response.profiles);

      return {
        profiles,
        totalResults: response.totalResults || profiles.length,
        searchCriteria: criteria,
        pagination: response.pagination,
        searchId: response.searchId || crypto.randomUUID(),
        searchedAt: new Date(),
        processingTime: response.processingTime || 0,
      };
    } catch (error) {
      console.error('LinkedIn search failed:', error);
      throw new Error(`LinkedIn search failed: ${error.message}`);
    }
  }

  async enrichLead(profileId: string): Promise<SalesNavigatorLead> {
    try {
      const [profile, insights, accountData] = await Promise.all([
        this.getDetailedProfile(profileId),
        this.getLeadInsights(profileId),
        this.getAccountInsights(profileId),
      ]);

      const buyingSignals = await this.detectBuyingSignals(profile);
      const engagementOpportunities = await this.findEngagementOpportunities(profile);
      const enrichmentData = await this.enrichWithMarketData(profile);

      return {
        id: profileId,
        profile,
        leadScore: this.calculateLeadScore(profile, insights, buyingSignals),
        buyingSignals,
        accountInsights: {
          ...accountData,
          ...insights,
        },
        engagementOpportunities,
        contactPreferences: await this.inferContactPreferences(profile),
        enrichmentData,
        lastEnriched: new Date(),
        nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    } catch (error) {
      console.error('Lead enrichment failed:', error);
      throw new Error(`Lead enrichment failed: ${error.message}`);
    }
  }

  async trackLeadActivity(profileId: string, days: number = 30): Promise<any> {
    try {
      const activities = await this.makeAuthenticatedRequest(`/people/${profileId}/activity`, {
        method: 'GET',
        query: `days=${days}`,
      });

      return {
        profileId,
        activities: activities.elements || [],
        period: days,
        lastTracked: new Date(),
        insights: await this.analyzeActivityPatterns(activities.elements || []),
      };
    } catch (error) {
      console.error('Activity tracking failed:', error);
      throw new Error(`Activity tracking failed: ${error.message}`);
    }
  }

  async getSimilarLeads(profileId: string, limit: number = 10): Promise<LinkedInProfile[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`/salesNavigator/${profileId}/similar`, {
        method: 'GET',
        query: `limit=${limit}`,
      });

      return response.elements || [];
    } catch (error) {
      console.error('Similar leads fetch failed:', error);
      throw new Error(`Similar leads fetch failed: ${error.message}`);
    }
  }

  async buildRelationshipMap(profileId: string): Promise<any> {
    try {
      const [connections, sharedConnections, alumni, colleagues] = await Promise.all([
        this.getConnections(profileId),
        this.getSharedConnections(profileId),
        this.getAlumni(profileId),
        this.getColleagues(profileId),
      ]);

      return {
        profileId,
        directConnections: connections || [],
        sharedConnections: sharedConnections || [],
        alumni: alumni || [],
        colleagues: colleagues || [],
        networkStrength: this.calculateNetworkStrength(connections, sharedConnections),
        potentialWarmIntros: this.identifyPotentialIntroductions(connections, sharedConnections),
        lastAnalyzed: new Date(),
      };
    } catch (error) {
      console.error('Relationship mapping failed:', error);
      throw new Error(`Relationship mapping failed: ${error.message}`);
    }
  }

  private buildSearchRequest(criteria: LinkedInSearchCriteria): any {
    return {
      keywords: criteria.keywords,
      filters: {
        industries: criteria.industries,
        locations: criteria.locations,
        companySize: criteria.companySizes,
        seniority: criteria.seniority,
        functions: criteria.functions,
        currentCompany: criteria.currentCompany,
        pastCompany: criteria.pastCompany,
        excludeKeywords: criteria.excludeKeywords,
        openToWork: criteria.openToWork,
        postedWithinLast30Days: criteria.postedWithinLast30Days,
      },
      pagination: {
        start: 0,
        count: 50,
      },
    };
  }

  private async makeAuthenticatedRequest(endpoint: string, options: any = {}): Promise<any> {
    const url = new URL(endpoint, this.apiBaseUrl);

    const defaultHeaders = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    };

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async enrichSearchResults(profiles: any[]): Promise<LinkedInProfile[]> {
    return Promise.all(profiles.map((profile) => this.mapToLinkedInProfile(profile)));
  }

  private mapToLinkedInProfile(data: any): LinkedInProfile {
    return {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      headline: data.headline,
      location: data.location,
      industry: data.industry,
      summary: data.summary,
      profileUrl: data.profileUrl,
      profileImageUrl: data.profileImageUrl,
      currentCompany: {
        name: data.currentCompany?.name || '',
        industry: data.currentCompany?.industry || '',
        size: data.currentCompany?.size || '',
        website: data.currentCompany?.website,
        type: data.currentCompany?.type || 'private_company',
        founded: data.currentCompany?.founded,
        headquarters: data.currentCompany?.headquarters,
      },
      experience: (data.experience || []).map((exp: any) => ({
        title: exp.title,
        company: exp.company,
        industry: exp.industry,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        description: exp.description,
      })),
      education: (data.education || []).map((edu: any) => ({
        schoolName: edu.schoolName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        activities: edu.activities,
      })),
      skills: (data.skills || []).map((skill: any) => ({
        name: skill.name,
        endorsements: skill.endorsements,
      })),
      certifications: data.certifications,
      languages: data.languages || [],
      connections: data.connections || { total: 0, connections: 0 },
      lastUpdated: new Date(),
      dataSources: ['linkedin_api'],
      confidenceScore: 0.9,
    };
  }

  private async getDetailedProfile(profileId: string): Promise<LinkedInProfile> {
    const response = await this.makeAuthenticatedRequest(`/people/${profileId}`);
    return this.mapToLinkedInProfile(response);
  }

  private async getLeadInsights(profileId: string): Promise<any> {
    const response = await this.makeAuthenticatedRequest(`/salesNavigator/${profileId}/insights`);
    return response;
  }

  private async getAccountInsights(profileId: string): Promise<any> {
    const response = await this.makeAuthenticatedRequest(`/salesNavigator/${profileId}/account`);
    return response;
  }

  private async detectBuyingSignals(profile: LinkedInProfile): Promise<any[]> {
    const signals = [];

    const currentExperience = profile.experience.find((exp) => exp.isCurrent);
    if (currentExperience && this.isRecentPromotion(currentExperience)) {
      signals.push({
        type: 'promotion',
        signal: 'Recent promotion detected',
        detectedAt: new Date(),
        confidence: 0.8,
        impact: 'high',
      });
    }

    if (profile.connections.connections > 500) {
      signals.push({
        type: 'network_growth',
        signal: 'Strong professional network',
        detectedAt: new Date(),
        confidence: 0.6,
        impact: 'medium',
      });
    }

    return signals;
  }

  private async findEngagementOpportunities(profile: LinkedInProfile): Promise<any[]> {
    const opportunities = [];

    if (profile.connections.connections > 100) {
      opportunities.push({
        type: 'shared_connection',
        description: 'Strong network for warm introductions',
        relevance: 0.8,
        suggestedAction: 'Request introduction through shared connection',
      });
    }

    if (profile.education.length > 0) {
      opportunities.push({
        type: 'alumni',
        description: 'Common educational background',
        relevance: 0.6,
        suggestedAction: 'Reference shared alma mater in outreach',
      });
    }

    return opportunities;
  }

  private async inferContactPreferences(profile: LinkedInProfile): Promise<any> {
    return {
      preferredChannel: profile.connections.connections > 200 ? 'linkedin_message' : 'email',
      bestContactTime: {
        dayOfWeek: 'tuesday',
        timeRange: '10:00 AM - 2:00 PM',
      },
      responseHistory: [],
    };
  }

  private async enrichWithMarketData(profile: LinkedInProfile): Promise<any> {
    return {
      companyData: {
        description: `${profile.currentCompany.name} is a ${profile.currentCompany.industry} company.`,
        specialties: [profile.industry],
        industryRankings: {},
        recentNews: [],
        fundingHistory: [],
        technologyStack: [],
      },
      marketContext: {
        industryTrends: [],
        competitorActivity: [],
        economicIndicators: [],
      },
    };
  }

  private calculateLeadScore(
    profile: LinkedInProfile,
    insights: any,
    buyingSignals: any[]
  ): number {
    let score = 0;

    if (profile.currentCompany.type === 'public_company') score += 20;
    if (profile.connections.connections > 500) score += 15;
    if (insights.decisionMakerLevel === 'vp' || insights.decisionMakerLevel === 'cxo') score += 25;
    if (buyingSignals.length > 0) score += 20;
    if (profile.experience.length > 3) score += 10;

    return Math.min(score, 100);
  }

  private isRecentPromotion(experience: any): boolean {
    if (!experience.startDate) return false;

    const monthsInRole = this.getMonthsBetween(experience.startDate, new Date());
    return monthsInRole <= 12;
  }

  private getMonthsBetween(startDate: any, endDate: Date): number {
    const start = new Date(startDate.year, startDate.month - 1);
    return (
      (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth())
    );
  }

  private async getConnections(profileId: string): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`/people/${profileId}/connections`);
      return response.elements || [];
    } catch (error) {
      console.error('Failed to get connections:', error);
      return [];
    }
  }

  private async getSharedConnections(profileId: string): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/people/${profileId}/sharedConnections`
      );
      return response.elements || [];
    } catch (error) {
      console.error('Failed to get shared connections:', error);
      return [];
    }
  }

  private async getAlumni(profileId: string): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`/people/${profileId}/alumni`);
      return response.elements || [];
    } catch (error) {
      console.error('Failed to get alumni:', error);
      return [];
    }
  }

  private async getColleagues(profileId: string): Promise<any[]> {
    try {
      const response = await this.makeAuthenticatedRequest(`/people/${profileId}/colleagues`);
      return response.elements || [];
    } catch (error) {
      console.error('Failed to get colleagues:', error);
      return [];
    }
  }

  private calculateNetworkStrength(connections: any[], sharedConnections: any[]): number {
    const directCount = connections.length;
    const sharedCount = sharedConnections.length;

    let strength = 0;
    if (directCount > 500) strength += 30;
    else if (directCount > 200) strength += 20;
    else if (directCount > 50) strength += 10;

    if (sharedCount > 10) strength += 20;
    else if (sharedCount > 5) strength += 10;

    return Math.min(strength, 100);
  }

  private identifyPotentialIntroductions(connections: any[], sharedConnections: any[]): any[] {
    return sharedConnections
      .filter((shared) => shared.connections.connections > 100)
      .slice(0, 5)
      .map((shared) => ({
        connection: shared,
        introductionType: 'warm_intro',
        confidence: 0.7,
      }));
  }

  private async analyzeActivityPatterns(activities: any[]): Promise<any> {
    const recentActivities = activities.filter(
      (activity) => new Date(activity.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    return {
      frequency: recentActivities.length,
      types: recentActivities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {}),
      engagementLevel: this.calculateEngagementLevel(recentActivities),
      lastActive:
        recentActivities.length > 0
          ? new Date(Math.max(...recentActivities.map((a) => new Date(a.timestamp))))
          : null,
    };
  }

  private calculateEngagementLevel(activities: any[]): string {
    if (activities.length === 0) return 'none';
    if (activities.length < 5) return 'low';
    if (activities.length < 15) return 'medium';
    return 'high';
  }
}
