import { useState, useEffect } from 'react';
import { UsersIcon, CreditCardIcon, ChartBarIcon, ExclamationCircleIcon, PlusIcon, EyeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { adminApi } from '../utils/adminApi';

interface Agency {
  id: string;
  name: string;
  contact_email: string;
  status: string;
  created_at: string;
}

interface AdminStats {
  totalAgencies: number;
  activeSubscriptions: number;
  totalRevenue: number;
  failedPayments: number;
}

interface SystemHealth {
  system_health: string;
  timestamp: string;
  global_metrics: {
    total_agencies: number;
    total_leads: number;
    total_revenue_cents: number;
    active_subscriptions: number;
  };
}

export default function Admin() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [newAgency, setNewAgency] = useState({ name: '', contact_email: '' });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [agenciesResponse, healthResponse] = await Promise.all([
        adminApi.getAgencies(),
        adminApi.getSystemHealth()
      ]);

      if (agenciesResponse.success) {
        setAgencies(agenciesResponse.data);
      }

      if (healthResponse.success) {
        setSystemHealth(healthResponse.data);
        setStats({
          totalAgencies: healthResponse.data.global_metrics.total_agencies,
          activeSubscriptions: healthResponse.data.global_metrics.active_subscriptions,
          totalRevenue: healthResponse.data.global_metrics.total_revenue_cents,
          failedPayments: 0 // This would come from billing events in a real app
        });
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adminApi.createAgency({
        name: newAgency.name,
        contact_email: newAgency.contact_email,
        status: 'active'
      });

      if (response.success) {
        setNewAgency({ name: '', contact_email: '' });
        setShowCreateForm(false);
        await loadAdminData(); // Reload data
      } else {
        alert('Failed to create agency: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating agency:', error);
      alert('Failed to create agency');
    }
  };

  const handleTestStripe = async () => {
    try {
      const response = await adminApi.testStripeCustomer();
      if (response.success) {
        alert(`Stripe test successful! Customer ID: ${response.customer.id}\n\nNote: ${response.note}`);
      } else {
        alert('Stripe test failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Stripe test error:', error);
      alert('Failed to test Stripe integration');
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
              <h1 className="text-3xl font-bold text-gray-900">AdsEngineer Admin</h1>
              <p className="text-gray-600">Manage agencies, subscriptions, and system health</p>
            </div>
            <button
              onClick={handleTestStripe}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
            >
              <CreditCardIcon className="h-5 w-5" />
              Test Stripe
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agencies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalAgencies || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeSubscriptions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats?.totalRevenue || 0) / 100}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.failedPayments || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agencies Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">Agencies</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Agency
            </button>
          </div>

          {/* Create Agency Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-md font-medium text-blue-900 mb-4">Create New Agency</h4>
              <form onSubmit={handleCreateAgency} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agency Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newAgency.name}
                      onChange={(e) => setNewAgency({...newAgency, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter agency name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newAgency.contact_email}
                      onChange={(e) => setNewAgency({...newAgency, contact_email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contact@agency.com"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    Create Agency
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agencies.map((agency) => (
                  <tr key={agency.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{agency.contact_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        agency.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agency.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(agency.created_at).toLocaleDateString()}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <button className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-1">
                         <EyeIcon className="h-4 w-4" />
                         View
                       </button>
                       <button className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-1">
                         <UserGroupIcon className="h-4 w-4" />
                         Users
                       </button>
                       <button className="text-red-600 hover:text-red-900">
                         Suspend
                       </button>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}