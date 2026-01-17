import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Signup from '../pages/Signup';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as any;

const mockStripePromise = Promise.resolve({
  publishableKey: 'pk_test_123',
});

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => mockStripePromise),
}));

const mockElements = {
  getElement: vi.fn(),
  mount: vi.fn(),
  unmount: vi.fn(),
};

const mockStripe = {
  confirmCardPayment: vi.fn(),
  elements: vi.fn(() => mockElements),
};

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadStripe.mockReturnValue(mockStripePromise);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderSignup = () => {
    return render(
      <Elements stripe={mockStripe}>
        <Signup />
      </Elements>
    );
  };

  describe('Initial Render', () => {
    it('should render signup form with step 1 active', () => {
      renderSignup();
      
      expect(screen.getByText('Join AdsEngineer')).toBeInTheDocument();
      expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
      expect(screen.getByText('Agency Name *')).toBeInTheDocument();
      expect(screen.getByText('Contact Name *')).toBeInTheDocument();
      expect(screen.getByText('Email Address *')).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Next: Platforms & Experience/i })).toBeInTheDocument();
    });

    it('should show progress indicator with step 1 highlighted', () => {
      renderSignup();
      
      const step1 = screen.getByText('1');
      const step2 = screen.getByText('2');
      const step3 = screen.getByText('3');
      
      expect(step1).toHaveClass('bg-blue-600', 'text-white');
      expect(step2).toHaveClass('bg-gray-200', 'text-gray-600');
      expect(step3).toHaveClass('bg-gray-200', 'text-gray-600');
    });

    it('should load pricing tiers on mount', async () => {
      const mockTiers = [
        { id: 'starter', name: 'Starter', price: 2900, lead_limit: 1000, features: ['Basic tracking'] },
        { id: 'pro', name: 'Professional', price: 9900, lead_limit: 10000, features: ['Advanced tracking', 'Priority support'] }
      ];
      
      mockedAxios.get.mockResolvedValue({
        data: { tiers: mockTiers }
      });

      renderSignup();
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/billing/pricing');
      });
    });
  });

  describe('Step 1: Company Information', () => {
    it('should validate required fields in step 1', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const nextButton = screen.getByRole('button', { name: /Next: Platforms & Experience/i });
      await user.click(nextButton);
      
      const agencyNameInput = screen.getByPlaceholderText('Your Agency Name');
      expect(agencyNameInput).toBeInvalid();
      
      const emailInput = screen.getByPlaceholderText('you@youragency.com');
      expect(emailInput).toBeInvalid();
      
      const nameInput = screen.getByPlaceholderText('Your Full Name');
      expect(nameInput).toBeInvalid();
    });

    it('should allow proceeding with valid company information', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@testagency.com');
      await user.type(screen.getByPlaceholderText('https://youragency.com'), 'https://testagency.com');
      await user.type(screen.getByPlaceholderText('+1 (555) 123-4567'), '+1234567890');
      
      const nextButton = screen.getByRole('button', { name: /Next: Platforms & Experience/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your marketing setup')).toBeInTheDocument();
      });
    });

    it('should update form state on input changes', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const agencyNameInput = screen.getByPlaceholderText('Your Agency Name');
      await user.type(agencyNameInput, 'Test Agency');
      
      expect(agencyNameInput).toHaveValue('Test Agency');
    });
  });

  describe('Step 2: Platforms & Experience', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderSignup();
      
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@testagency.com');
      
      const nextButton = screen.getByRole('button', { name: /Next: Platforms & Experience/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your marketing setup')).toBeInTheDocument();
      });
    });

    it('should display platform options', () => {
      renderSignup();
      
      const platforms = ['google-ads', 'facebook-ads', 'tiktok-ads', 'linkedin-ads', 'other'];
      
      platforms.forEach(platform => {
        const checkbox = screen.getByText(new RegExp(platform.replace('-', ' '), 'i'));
        expect(checkbox).toBeInTheDocument();
      });
    });

    it('should handle platform selection', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const googleAdsCheckbox = screen.getByText(/google ads/i);
      await user.click(googleAdsCheckbox);
      
      expect(googleAdsCheckbox).toBeChecked();
      
      await user.click(googleAdsCheckbox);
      expect(googleAdsCheckbox).not.toBeChecked();
    });

    it('should handle GHL experience selection', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const basicRadio = screen.getByText('Basic setup');
      await user.click(basicRadio);
      
      expect(basicRadio).toBeChecked();
    });

    it('should allow navigation back to step 1', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const backButton = screen.getByRole('button', { name: 'Back' });
      await user.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Pricing & Payment', () => {
    beforeEach(async () => {
      const mockTiers = [
        { id: 'starter', name: 'Starter', price: 2900, lead_limit: 1000, features: ['Basic tracking'], stripe_price_id: 'price_123' },
        { id: 'pro', name: 'Professional', price: 9900, lead_limit: 10000, features: ['Advanced tracking'], stripe_price_id: 'price_456' }
      ];
      
      mockedAxios.get.mockResolvedValue({
        data: { tiers: mockTiers }
      });

      const user = userEvent.setup();
      renderSignup();
      
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@testagency.com');
      
      let nextButton = screen.getByRole('button', { name: /Next: Platforms & Experience/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your marketing setup')).toBeInTheDocument();
      });
      
      const ghlRadio = screen.getByText('Basic setup');
      await user.click(ghlRadio);
      
      nextButton = screen.getByRole('button', { name: /Next: Choose Plan/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Choose your plan')).toBeInTheDocument();
      });
    });

    it('should display pricing tiers', () => {
      renderSignup();
      
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
      expect(screen.getByText('$29')).toBeInTheDocument();
      expect(screen.getByText('$99')).toBeInTheDocument();
    });

    it('should handle plan selection', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const starterPlan = screen.getByText('Starter').closest('[role="button"]');
      await user.click(starterPlan);
      
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    it('should disable submit button when no plan selected', () => {
      renderSignup();
      
      const submitButton = screen.getByRole('button', { name: /Start Free Trial/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show payment information when plan selected', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const proPlan = screen.getByText('Professional').closest('[role="button"]');
      await user.click(proPlan);
      
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
      expect(screen.getByText('Card Information')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    const mockFormData = {
      name: 'Test Agency',
      contactName: 'John Doe',
      contactEmail: 'john@testagency.com',
      companyWebsite: 'https://testagency.com',
      phone: '+1234567890',
      monthlyAdSpend: '5k-10k',
      primaryPlatforms: ['google-ads', 'facebook-ads'],
      ghlExperience: 'basic',
      selectedTier: 'starter'
    };

    beforeEach(async () => {
      const mockTiers = [
        { id: 'starter', name: 'Starter', price: 2900, lead_limit: 1000, features: ['Basic tracking'], stripe_price_id: 'price_123' }
      ];
      
      mockedAxios.get.mockResolvedValue({
        data: { tiers: mockTiers }
      });

      mockedAxios.post.mockImplementation((url, data) => {
        if (url === '/api/v1/onboarding/register') {
          return Promise.resolve({
            data: { customer_id: 'customer_123' }
          });
        }
        if (url === '/api/v1/billing/customers') {
          return Promise.resolve({
            data: { id: 'stripe_customer_123' }
          });
        }
        if (url === '/api/v1/billing/subscriptions') {
          return Promise.resolve({
            data: { client_secret: 'pi_123_secret' }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const user = userEvent.setup();
      renderSignup();
      
      await user.type(screen.getByPlaceholderText('Your Agency Name'), mockFormData.name);
      await user.type(screen.getByPlaceholderText('Your Full Name'), mockFormData.contactName);
      await user.type(screen.getByPlaceholderText('you@youragency.com'), mockFormData.contactEmail);
      await user.type(screen.getByPlaceholderText('https://youragency.com'), mockFormData.companyWebsite);
      await user.type(screen.getByPlaceholderText('+1 (555) 123-4567'), mockFormData.phone);
      
      let nextButton = screen.getByRole('button', { name: /Next: Platforms & Experience/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your marketing setup')).toBeInTheDocument();
      });
      
      const googleAdsCheckbox = screen.getByText(/google ads/i);
      const facebookAdsCheckbox = screen.getByText(/facebook ads/i);
      await user.click(googleAdsCheckbox);
      await user.click(facebookAdsCheckbox);
      
      const ghlRadio = screen.getByText('Basic setup');
      await user.click(ghlRadio);
      
      nextButton = screen.getByRole('button', { name: /Next: Choose Plan/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Choose your plan')).toBeInTheDocument();
      });
      
      const starterPlan = screen.getByText('Starter').closest('[role="button"]');
      await user.click(starterPlan);
    });

    it('should handle successful signup', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: null
      });
      
      mockElements.getElement.mockReturnValue({
        _complete: true
      });

      const submitButton = screen.getByRole('button', { name: /Start Free Trial/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
        expect(screen.getByText('Your account has been created and payment processed successfully')).toBeInTheDocument();
      });
    });

    it('should handle payment failure', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: { message: 'Your card was declined.' }
      });
      
      const submitButton = screen.getByRole('button', { name: /Start Free Trial/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your card was declined.')).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      mockStripe.confirmCardPayment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      const submitButton = screen.getByRole('button', { name: /Start Free Trial/i });
      await user.click(submitButton);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle API errors during registration', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      mockedAxios.post.mockRejectedValue({
        response: { data: { error: 'Email already registered' } }
      });
      
      const submitButton = screen.getByRole('button', { name: /Start Free Trial/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email already registered')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message and redirect option', () => {
      renderSignup();
      
      expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
      expect(screen.getByText('Check your email for setup instructions and API credentials')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
    });

    it('should redirect to login when clicking Go to Dashboard', async () => {
      const user = userEvent.setup();
      renderSignup();
      
      const goToDashboardButton = screen.getByRole('button', { name: 'Go to Dashboard' });
      await user.click(goToDashboardButton);
      
      expect(window.location.href).toBe('/login');
    });
  });
});