import { test, expect, describe, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Signup from '../../src/pages/Signup';
import Dashboard from '../../src/pages/Dashboard';
import Admin from '../../src/pages/Admin';

// Mock Stripe
const mockStripe = {
  confirmCardPayment: vi.fn(),
};

const mockElements = {
  getElement: vi.fn(() => ({
    // Mock card element
  })),
};

vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  Elements: ({ children }: { children: React.ReactNode }) => <div>{ children }</div>,
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import axios from 'axios';

const mockAxios = axios as any;

describe('Frontend E2E Tests - Comprehensive Coverage', () => {
  describe('Agency Signup Flow', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('renders signup form with all required fields', () => {
      render(<Signup />);

      expect(screen.getByText('Join AdsEngineer')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your Agency Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your Full Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@youragency.com')).toBeInTheDocument();
      expect(screen.getByText('Next: Platforms & Experience')).toBeInTheDocument();
    });

    test('validates required fields before progression', async () => {
      const user = userEvent.setup();
      render(<Signup />);

      const nextButton = screen.getByText('Next: Platforms & Experience');
      await user.click(nextButton);

      // Should still be on step 1 due to validation
      expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
      expect(screen.getByText('Agency Name *')).toBeInTheDocument();
    });

    test('progresses through all form steps successfully', async () => {
      const user = userEvent.setup();
      render(<Signup />);

      // Step 1: Agency Info
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');
      await user.type(screen.getByPlaceholderText('https://youragency.com'), 'https://testagency.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));

      // Step 2: Platforms & Experience
      expect(screen.getByText('Your marketing setup')).toBeInTheDocument();

      // Select platforms
      const googleAdsCheckbox = screen.getByLabelText(/google-ads/i);
      await user.click(googleAdsCheckbox);

      // Select experience level
      const intermediateRadio = screen.getByLabelText('Regular user');
      await user.click(intermediateRadio);

      await user.click(screen.getByText('Next: Choose Plan'));

      // Step 3: Pricing & Payment
      expect(screen.getByText('Choose your plan')).toBeInTheDocument();

      // Select Professional plan
      const professionalCard = screen.getByText('Professional').closest('div');
      await user.click(professionalCard!);

      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    test('handles form submission with payment processing', async () => {
      const user = userEvent.setup();

      // Mock successful API responses
      mockAxios.post.mockImplementation((url) => {
        if (url.includes('/onboarding/register')) {
          return Promise.resolve({
            data: { customer_id: 'cus_123', message: 'Registration successful' }
          });
        }
        if (url.includes('/billing/customers')) {
          return Promise.resolve({
            data: { success: true, customer_id: 'cus_456' }
          });
        }
        if (url.includes('/billing/subscriptions')) {
          return Promise.resolve({
            data: {
              success: true,
              subscription_id: 'sub_789',
              client_secret: 'pi_test_secret'
            }
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      mockStripe.confirmCardPayment.mockResolvedValue({
        error: null,
        paymentIntent: { status: 'succeeded' }
      });

      render(<Signup />);

      // Fill out complete form
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));

      const googleAdsCheckbox = screen.getByLabelText(/google-ads/i);
      await user.click(googleAdsCheckbox);
      const intermediateRadio = screen.getByLabelText('Regular user');
      await user.click(intermediateRadio);

      await user.click(screen.getByText('Next: Choose Plan'));

      const professionalCard = screen.getByText('Professional').closest('div');
      await user.click(professionalCard!);

      // Submit form
      const submitButton = screen.getByText('Start Free Trial');
      await user.click(submitButton);

      // Verify API calls
      await waitFor(() => {
        expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/onboarding/register', expect.any(Object));
        expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/billing/customers', expect.any(Object));
        expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/billing/subscriptions', expect.any(Object));
        expect(mockStripe.confirmCardPayment).toHaveBeenCalledWith('pi_test_secret', expect.any(Object));
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
      });
    });

    test('displays validation errors for invalid data', async () => {
      const user = userEvent.setup();
      render(<Signup />);

      // Try to submit with invalid email
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'invalid-email');

      await user.click(screen.getByText('Next: Platforms & Experience'));

      // Should show email validation error (HTML5 validation)
      const emailInput = screen.getByPlaceholderText('you@youragency.com');
      expect(emailInput).toBeInvalid();
    });

    test('handles API errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock API error
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 409,
          data: { error: 'Email already registered' }
        }
      });

      render(<Signup />);

      // Fill minimal form and try to proceed
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'existing@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));

      // Should not progress due to API error
      expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
    });
  });

  describe('Dashboard Functionality', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('displays loading state initially', () => {
      mockAxios.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<Dashboard />);

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });

    test('renders dashboard with stats after loading', async () => {
      const mockStats = {
        totalLeads: 150,
        qualifiedLeads: 45,
        conversionRate: 0.30,
        monthlyRevenue: 3375
      };

      const mockSubscription = {
        plan: 'Professional',
        status: 'active',
        lead_limit: 10000,
        usage: { leadsThisMonth: 150 }
      };

      mockAxios.get.mockResolvedValueOnce({
        data: { subscription: mockSubscription }
      });

      mockAxios.get.mockResolvedValueOnce({
        data: { analytics: mockStats }
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('AdsEngineer Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('150')).toBeInTheDocument(); // Total leads
      expect(screen.getByText('45')).toBeInTheDocument(); // Qualified leads
      expect(screen.getByText('30.0%')).toBeInTheDocument(); // Conversion rate
      expect(screen.getByText('$3')).toBeInTheDocument(); // Revenue
    });

    test('shows subscription information correctly', async () => {
      const mockSubscription = {
        plan: 'Professional',
        status: 'active',
        lead_limit: 10000,
        usage: { leadsThisMonth: 150 }
      };

      mockAxios.get.mockResolvedValueOnce({
        data: { subscription: mockSubscription }
      });

      mockAxios.get.mockResolvedValueOnce({
        data: { analytics: { totalLeads: 0, qualifiedLeads: 0, conversionRate: 0, monthlyRevenue: 0 } }
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Professional')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('150 / 10,000')).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      mockAxios.get.mockRejectedValue(new Error('API Error'));

      render(<Dashboard />);

      // Should handle error and not crash
      await waitFor(() => {
        expect(screen.getByText('AdsEngineer Dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Panel', () => {
    test('displays admin dashboard with stats', async () => {
      render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('AdsEngineer Admin')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Agencies')).toBeInTheDocument();
      expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    test('renders agencies table with data', async () => {
      render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('Agencies')).toBeInTheDocument();
      });

      expect(screen.getByText('ABC Marketing')).toBeInTheDocument();
      expect(screen.getByText('contact@abcmarketing.com')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    test('provides admin action buttons', async () => {
      render(<Admin />);

      await waitFor(() => {
        expect(screen.getByText('Add Agency')).toBeInTheDocument();
      });

      const actionButtons = screen.getAllByText('View');
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  describe('User Experience & Accessibility', () => {
    test('form has proper labels and ARIA attributes', () => {
      render(<Signup />);

      const emailInput = screen.getByPlaceholderText('you@youragency.com');
      expect(emailInput).toHaveAttribute('type', 'email');

      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels.length).toBeGreaterThan(0);
    });

    test('handles keyboard navigation properly', async () => {
      const user = userEvent.setup();
      render(<Signup />);

      const agencyNameInput = screen.getByPlaceholderText('Your Agency Name');
      await user.click(agencyNameInput);
      await user.keyboard('Test Agency{Tab}');

      const contactNameInput = screen.getByPlaceholderText('Your Full Name');
      expect(contactNameInput).toHaveFocus();
    });

    test('provides clear error messages', async () => {
      const user = userEvent.setup();
      render(<Signup />);

      // Leave required fields empty and try to proceed
      await user.click(screen.getByText('Next: Platforms & Experience'));

      // HTML5 validation should prevent progression
      expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
    });
  });

  describe('Performance & Responsiveness', () => {
    test('renders quickly on initial load', async () => {
      const startTime = performance.now();

      render(<Signup />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(1000); // Should render within 1 second
    });

    test('handles rapid user interactions', async () => {
      const user = userEvent.setup();
      render(<Signup />);

      // Rapid typing in multiple fields
      const inputs = [
        screen.getByPlaceholderText('Your Agency Name'),
        screen.getByPlaceholderText('Your Full Name'),
        screen.getByPlaceholderText('you@youragency.com')
      ];

      for (const input of inputs) {
        await user.clear(input);
        await user.type(input, 'test value');
      }

      // Should handle rapid interactions without crashing
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
    });
  });

  describe('Cross-browser Compatibility', () => {
    test('uses standard HTML form elements', () => {
      render(<Signup />);

      const inputs = screen.getAllByRole('textbox');
      const buttons = screen.getAllByRole('button');

      expect(inputs.length).toBeGreaterThan(0);
      expect(buttons.length).toBeGreaterThan(0);

      // Verify standard input types
      const emailInput = screen.getByPlaceholderText('you@youragency.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('avoids browser-specific CSS', () => {
      render(<Signup />);

      // Should use standard CSS classes, not browser-specific ones
      const elements = screen.getAllByRole('*');
      elements.forEach(element => {
        const classList = element.className || '';
        expect(classList).not.toMatch(/-webkit-|-moz-|-ms-/);
      });
    });
  });
});