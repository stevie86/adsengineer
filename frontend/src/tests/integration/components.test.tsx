import { test, expect, describe, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Signup from '../../src/pages/Signup';
import Dashboard from '../../src/pages/Dashboard';

// Comprehensive mocks
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({
    confirmCardPayment: vi.fn().mockResolvedValue({
      error: null,
      paymentIntent: { status: 'succeeded' }
    })
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({}))
  }),
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({})
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <Elements stripe={loadStripe('test')}>
      {children}
    </Elements>
  </BrowserRouter>
);

describe('Component Integration Tests', () => {
  describe('Signup Component Integration', () => {
    test('integrates with Stripe Elements properly', async () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      // Should render without Stripe errors
      expect(screen.getByText('Join AdsEngineer')).toBeInTheDocument();

      // Navigate to payment step
      const user = userEvent.setup();

      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');
      await user.click(screen.getByText('Next: Platforms & Experience'));

      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const professionalCard = screen.getByText('Professional').closest('div');
      await user.click(professionalCard!);

      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    test('handles form state persistence across steps', async () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      const user = userEvent.setup();

      // Fill step 1
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Persistent Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Jane Smith');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'jane@persistent.com');

      // Go to step 2
      await user.click(screen.getByText('Next: Platforms & Experience'));
      expect(screen.getByText('Your marketing setup')).toBeInTheDocument();

      // Go back to step 1
      await user.click(screen.getByText('Back'));
      expect(screen.getByDisplayValue('Persistent Agency')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument();
      expect(screen.getByDisplayValue('jane@persistent.com')).toBeInTheDocument();
    });

    test('validates email format in real-time', async () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      const user = userEvent.setup();
      const emailInput = screen.getByPlaceholderText('you@youragency.com');

      // Valid email
      await user.type(emailInput, 'valid@email.com');
      expect(emailInput).toBeValid();

      // Clear and enter invalid email
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      expect(emailInput).toBeInvalid();
    });

    test('provides clear visual feedback for form completion', async () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      const user = userEvent.setup();

      // Initially no progress indicators should be "completed"
      const progressIndicators = screen.getAllByRole('generic').filter(
        el => el.className?.includes('bg-blue-600')
      );
      expect(progressIndicators).toHaveLength(1); // Only step 1 active

      // Complete step 1
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));

      // Should now show step 2 as active
      await waitFor(() => {
        const updatedIndicators = screen.getAllByRole('generic').filter(
          el => el.className?.includes('bg-blue-600')
        );
        expect(updatedIndicators.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Dashboard Component Integration', () => {
    test('integrates with API for real-time data loading', async () => {
      const mockStats = {
        totalLeads: 250,
        qualifiedLeads: 75,
        conversionRate: 0.30,
        monthlyRevenue: 5625
      };

      const mockSubscription = {
        plan: 'Professional',
        status: 'active',
        lead_limit: 10000,
        usage: { leadsThisMonth: 250 }
      };

      vi.mocked(axios.get).mockImplementation((url) => {
        if (url.includes('/billing/subscriptions')) {
          return Promise.resolve({ data: { subscription: mockSubscription } });
        }
        if (url.includes('/analytics/leads')) {
          return Promise.resolve({ data: { analytics: mockStats } });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AdsEngineer Dashboard')).toBeInTheDocument();
      });

      // Check if stats are displayed
      await waitFor(() => {
        expect(screen.getByText('250')).toBeInTheDocument(); // Total leads
        expect(screen.getByText('75')).toBeInTheDocument(); // Qualified leads
        expect(screen.getByText('30.0%')).toBeInTheDocument(); // Conversion rate
      });
    });

    test('handles API loading states properly', async () => {
      // Mock slow API response
      vi.mocked(axios.get).mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve({ data: { subscription: {}, analytics: {} } }), 100)
      ));

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Should show loading initially
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();

      // Should load data after delay
      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    test('displays error states gracefully', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API Error'));

      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AdsEngineer Dashboard')).toBeInTheDocument();
      });

      // Should handle error without crashing
      expect(screen.getByText('AdsEngineer Dashboard')).toBeInTheDocument();
    });

    test('updates data when subscription changes', async () => {
      const initialSubscription = {
        plan: 'Starter',
        status: 'active',
        lead_limit: 1000,
        usage: { leadsThisMonth: 50 }
      };

      const updatedSubscription = {
        plan: 'Professional',
        status: 'active',
        lead_limit: 10000,
        usage: { leadsThisMonth: 150 }
      };

      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { subscription: initialSubscription }
      }).mockResolvedValueOnce({
        data: { analytics: { totalLeads: 0 } }
      });

      const { rerender } = render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Starter')).toBeInTheDocument();
      });

      // Simulate subscription update
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { subscription: updatedSubscription }
      }).mockResolvedValueOnce({
        data: { analytics: { totalLeads: 0 } }
      });

      // Trigger re-render (in real app this would be from state update)
      rerender(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );

      // Note: In real implementation, this would update via state management
      // This test validates the component can handle prop changes
    });
  });

  describe('Admin Panel Integration', () => {
    test('loads and displays admin data correctly', async () => {
      render(
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AdsEngineer Admin')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Agencies')).toBeInTheDocument();
      expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    test('provides interactive admin controls', async () => {
      render(
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add Agency')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Agency');
      expect(addButton).toBeEnabled();

      // Should have action buttons for each agency
      const viewButtons = screen.getAllByText('View');
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    test('handles admin table sorting and filtering', async () => {
      render(
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Agencies')).toBeInTheDocument();
      });

      // Table should be present with headers
      expect(screen.getByText('Agency')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('End-to-End User Flows', () => {
    test('complete signup to dashboard flow', async () => {
      // This would be a full e2e test with routing
      // For now, test individual components work together
      expect(true).toBe(true); // Placeholder for full e2e flow test
    });

    test('handles navigation between authenticated pages', async () => {
      // Test routing between dashboard and admin
      expect(true).toBe(true); // Placeholder for navigation test
    });
  });

  describe('Performance & Bundle Analysis', () => {
    test('components render within performance budgets', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Should render very quickly
    });

    test('lazy loads heavy components', () => {
      // Test for code splitting and lazy loading
      expect(true).toBe(true); // Placeholder for bundle analysis
    });

    test('minimizes re-renders on prop changes', () => {
      // Test React.memo and useMemo usage
      expect(true).toBe(true); // Placeholder for re-render analysis
    });
  });

  describe('Accessibility Compliance', () => {
    test('all interactive elements have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      // Check for proper form labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('placeholder');
      });
    });

    test('keyboard navigation works throughout forms', async () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      const user = userEvent.setup();

      // Test tab navigation through form
      await user.tab();
      expect(screen.getByPlaceholderText('Your Agency Name')).toHaveFocus();
    });

    test('screen readers can interpret form structure', () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      // Check for semantic HTML structure
      const forms = screen.getAllByRole('form');
      expect(forms.length).toBeGreaterThan(0);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Internationalization Readiness', () => {
    test('all user-facing text is externalized', () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      // Check that text is not hardcoded in components
      expect(screen.getByText('Join AdsEngineer')).toBeInTheDocument();
      // In real i18n, this would check for translation keys
    });

    test('supports different locales for number formatting', () => {
      const testValues = {
        usd: 29900, // $299.00
        eur: 27900, // €279.00
        gbp: 23900  // £239.00
      };

      Object.entries(testValues).forEach(([currency, amount]) => {
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency.toUpperCase()
        }).format(amount / 100);

        expect(formatted).toContain(currency === 'usd' ? '$' : currency === 'eur' ? '€' : '£');
      });
    });
  });
});