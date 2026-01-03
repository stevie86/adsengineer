import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

interface PricingTier {
  id: string;
  name: string;
  price: number;
  lead_limit: number;
  features: string[];
}

interface SignupFormData {
  name: string;
  contactName: string;
  contactEmail: string;
  companyWebsite: string;
  phone: string;
  monthlyAdSpend: string;
  primaryPlatforms: string[];
  ghlExperience: string;
  selectedTier: string;
}

export default function Signup() {
  const stripe = useStripe();
  const elements = useElements();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);

  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    contactName: '',
    contactEmail: '',
    companyWebsite: '',
    phone: '',
    monthlyAdSpend: '',
    primaryPlatforms: [],
    ghlExperience: '',
    selectedTier: ''
  });

  // Load pricing tiers on mount
  useState(() => {
    axios.get('/api/v1/billing/pricing').then(response => {
      setPricingTiers(response.data.tiers);
    }).catch(err => {
      console.error('Failed to load pricing:', err);
    });
  });

  const handleInputChange = (field: keyof SignupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      primaryPlatforms: checked
        ? [...prev.primaryPlatforms, platform]
        : prev.primaryPlatforms.filter(p => p !== platform)
    }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: Register agency
      const registerResponse = await axios.post('/api/v1/onboarding/register', {
        email: formData.contactEmail,
        company_name: formData.name,
        website: formData.companyWebsite,
        ghl_location_id: formData.phone, // Using phone field for now
        accept_tos: true,
        accept_dpa: true,
        accept_privacy: true
      });

      const customerId = registerResponse.data.customer_id;

      // Step 2: Create Stripe customer
      await axios.post('/api/v1/billing/customers', {
        email: formData.contactEmail,
        name: formData.contactName,
        agency_id: customerId
      });

      // Step 3: Create subscription
      const subscriptionResponse = await axios.post('/api/v1/billing/subscriptions', {
        customer_id: customerId,
        price_id: pricingTiers.find(t => t.id === formData.selectedTier)?.stripe_price_id,
        agency_id: customerId
      });

      const { client_secret } = subscriptionResponse.data;

      // Step 4: Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: paymentError } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.contactName,
            email: formData.contactEmail,
          },
        }
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      setSuccess(true);
      setStep(4);

    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AdsEngineer!</h2>
          <p className="text-gray-600 mb-4">
            Your account has been created and payment processed successfully.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Check your email for setup instructions and API credentials.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn-primary w-full"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join AdsEngineer</h1>
          <p className="text-lg text-gray-600">
            Stop losing 20% of your conversion data. Start protecting your revenue.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Tell us about your agency</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your Agency Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="Your Full Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-field"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="you@youragency.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    value={formData.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    placeholder="https://youragency.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="input-field"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button type="button" onClick={nextStep} className="btn-primary">
                  Next: Platforms & Experience
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Platforms & Experience */}
          {step === 2 && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Your marketing setup</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Which platforms do you use? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['google-ads', 'facebook-ads', 'tiktok-ads', 'linkedin-ads', 'other'].map((platform) => (
                      <label key={platform} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={formData.primaryPlatforms.includes(platform)}
                          onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                        />
                        <span className="ml-2 text-sm capitalize">
                          {platform.replace('-', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Ad Spend
                  </label>
                  <select
                    className="input-field"
                    value={formData.monthlyAdSpend}
                    onChange={(e) => handleInputChange('monthlyAdSpend', e.target.value)}
                  >
                    <option value="">Select range</option>
                    <option value="under-1k">Under $1,000</option>
                    <option value="1k-5k">$1,000 - $5,000</option>
                    <option value="5k-10k">$5,000 - $10,000</option>
                    <option value="10k-25k">$10,000 - $25,000</option>
                    <option value="25k-50k">$25,000 - $50,000</option>
                    <option value="over-50k">Over $50,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GoHighLevel Experience *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'none', label: 'No experience' },
                      { value: 'basic', label: 'Basic setup' },
                      { value: 'intermediate', label: 'Regular user' },
                      { value: 'advanced', label: 'Power user / Custom workflows' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="ghl-experience"
                          value={option.value}
                          required
                          className="border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={formData.ghlExperience === option.value}
                          onChange={(e) => handleInputChange('ghlExperience', e.target.value)}
                        />
                        <span className="ml-2 text-sm">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button type="button" onClick={prevStep} className="btn-secondary">
                  Back
                </button>
                <button type="button" onClick={nextStep} className="btn-primary">
                  Next: Choose Plan
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pricing & Payment */}
          {step === 3 && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Choose your plan</h3>

              <div className="space-y-4">
                {pricingTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      formData.selectedTier === tier.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('selectedTier', tier.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">{tier.name}</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          ${(tier.price / 100).toFixed(0)}
                          <span className="text-sm font-normal text-gray-600">/month</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {tier.lead_limit === -1 ? 'Unlimited' : `${tier.lead_limit.toLocaleString()}`} leads/month
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="tier"
                        value={tier.id}
                        checked={formData.selectedTier === tier.id}
                        onChange={() => handleInputChange('selectedTier', tier.id)}
                        className="mt-1"
                      />
                    </div>

                    <ul className="mt-3 space-y-1">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {formData.selectedTier && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">Payment Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Information
                      </label>
                      <div className="border border-gray-300 rounded-md p-3 bg-white">
                        <CardElement options={CARD_ELEMENT_OPTIONS} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <button type="button" onClick={prevStep} className="btn-secondary">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.selectedTier || !stripe}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Start Free Trial'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}