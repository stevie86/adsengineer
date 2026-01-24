import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { agencyService, Agency } from '../../services/agencies';

export const IntegrationView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAgency = async () => {
      try {
        setLoading(true);
        // In a real app we'd have a getById method, but for MVP we filter the list or add a new endpoint
        // Adding a quick getById helper here would be ideal, but assuming the list is small for now:
        const all = await agencyService.getAll(1, 100); 
        const found = all.data.find((a: Agency) => a.id === id);
        
        if (found) {
          // Parse config if it's a string (D1 returns it as string sometimes)
          if (typeof found.config === 'string') {
            found.config = JSON.parse(found.config);
          }
          setAgency(found);
        } else {
          setError('Agency not found');
        }
      } catch (err) {
        setError('Failed to load agency details');
      } finally {
        setLoading(false);
      }
    };
    fetchAgency();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !agency) return <div className="p-6 text-red-600">{error || 'Agency not found'}</div>;

  const webhookUrl = `https://adsengineer-cloud.adsengineer.workers.dev/api/v1/woocommerce/webhook`;
  const webhookSecret = agency.config?.woocommerce_webhook_secret || 'Not configured';
  const siteId = agency.id;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Integration Details: {agency.name}</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700">WooCommerce Setup</h3>
        </div>
        <div className="p-6 space-y-6">
          
          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">STEP 1</span>
              <h4 className="font-medium text-gray-900">Install WordPress Plugin</h4>
            </div>
            <p className="text-gray-600 text-sm mb-3">Download and install the AdsEngineer tracking plugin on your WordPress site.</p>
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-mono text-gray-700">Site ID</span>
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => navigator.clipboard.writeText(siteId)}
                >
                  Copy
                </button>
              </div>
              <code className="block bg-white p-2 rounded border border-gray-200 text-sm font-mono break-all">
                {siteId}
              </code>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">STEP 2</span>
              <h4 className="font-medium text-gray-900">Configure Webhook</h4>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Go to WooCommerce Settings &gt; Advanced &gt; Webhooks and add a new webhook.
            </p>
            
            <div className="grid gap-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-mono text-gray-700">Delivery URL</span>
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  >
                    Copy
                  </button>
                </div>
                <code className="block bg-white p-2 rounded border border-gray-200 text-sm font-mono break-all text-gray-600">
                  {webhookUrl}
                </code>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-mono text-gray-700">Secret</span>
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={() => navigator.clipboard.writeText(webhookSecret)}
                  >
                    Copy
                  </button>
                </div>
                <code className="block bg-white p-2 rounded border border-gray-200 text-sm font-mono break-all text-gray-800 font-bold">
                  {webhookSecret}
                </code>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
