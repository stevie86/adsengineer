import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircleIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  monthlyRevenue: number;
}

interface SubscriptionInfo {
  plan: string;
  status: string;
  leadLimit: number;
  usage: {
    leadsThisMonth: number;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get subscription info (would use actual agency ID in real app)
      const subResponse = await axios.get('/api/v1/billing/subscriptions/test-agency-id');
      setSubscription(subResponse.data.subscription);

      // Get analytics (would use actual agency ID)
      const analyticsResponse = await axios.get('/api/v1/analytics/leads');
      const analytics = analyticsResponse.data.analytics;

      setStats({
        totalLeads: analytics.total_leads || 0,
        qualifiedLeads: analytics.qualified_leads || 0,
        conversionRate: analytics.conversion_rate || 0,
        monthlyRevenue: analytics.avg_lead_value * (analytics.qualified_leads || 0) / 100
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AdsEngineer Dashboard</h1>
              <p className="text-gray-600">Monitor your conversion tracking and lead generation</p>
            </div>
            <div className="flex items-center space-x-4">
              {subscription && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Current Plan</p>
                  <p className="font-medium">{subscription.plan}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalLeads.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.qualifiedLeads.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.conversionRate ? (stats.conversionRate * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">$</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats?.monthlyRevenue.toFixed(0) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Info */}
        {subscription && (
          <div className="card mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-medium">{subscription.plan}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {subscription.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Usage</p>
                <p className="font-medium">
                  {subscription.usage.leadsThisMonth} / {
                    subscription.leadLimit === -1
                      ? 'Unlimited'
                      : subscription.leadLimit.toLocaleString()
                  } leads
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn-primary">
              View API Keys
            </button>
            <button className="btn-secondary">
              Download Tracking Snippet
            </button>
            <button className="btn-secondary">
              Contact Support
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}