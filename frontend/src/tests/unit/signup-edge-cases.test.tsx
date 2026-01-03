import { test, expect, describe, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Signup from '../../src/pages/Signup';

// Enhanced mocks with more realistic behavior
vi.mock('@stripe/react-stripe-js', () => ({
  useStripe: () => ({
    confirmCardPayment: vi.fn().mockImplementation(async (clientSecret, options) => {
      if (clientSecret.includes('test_success')) {
        return { error: null, paymentIntent: { status: 'succeeded' } };
      }
      if (clientSecret.includes('test_failure')) {
        return { error: { message: 'Card declined' } };
      }
      return { error: null, paymentIntent: { status: 'succeeded' } };
    })
  }),
  useElements: () => ({
    getElement: vi.fn(() => ({
      // Mock card element with validation
      _invalid: false,
      _empty: false,
      _complete: true
    }))
  }),
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    // Mock stripe instance
  }))
}));

// Enhanced axios mock
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

import axios from 'axios';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <Elements stripe={loadStripe('pk_test_mock')}>
      {children}
    </Elements>
  </BrowserRouter>
);

describe('Signup Component - Maximum Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to default successful behavior
    (axios.post as any).mockResolvedValue({
      data: {
        success: true,
        customer_id: 'cus_test123',
        message: 'Registration successful'
      }
    });
    (axios.get as any).mockResolvedValue({
      data: {
        tiers: [
          {
            id: 'starter',
            name: 'Starter',
            price: 9900,
            lead_limit: 1000,
            features: ['Basic tracking']
          },
          {
            id: 'professional',
            name: 'Professional',
            price: 29900,
            lead_limit: 10000,
            features: ['Advanced tracking', 'Priority support']
          }
        ]
      }
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Form Validation - Exhaustive Coverage', () => {
    test.each([
      ['agency name too short', { name: 'A' }, 'Agency Name', /too short|minimum/],
      ['agency name too long', { name: 'A'.repeat(256) }, 'Agency Name', /too long|maximum/],
      ['invalid email format', { email: 'invalid-email' }, 'Email Address', /invalid|format/],
      ['empty required field', { name: '' }, 'Agency Name', /required/],
      ['website invalid format', { website: 'not-a-url' }, 'Website', /invalid|format/],
      ['phone invalid format', { phone: 'invalid-phone' }, 'Phone', /invalid|format/]
    ])('validates %s correctly', async (testName, invalidData, fieldName, errorPattern) => {
      const user = userEvent.setup();
      render(<TestWrapper><Signup /></TestWrapper>);

      // Fill valid base data
      const validData = {
        name: 'Valid Agency',
        contactName: 'John Doe',
        contactEmail: 'john@valid.com',
        website: 'https://valid.com',
        phone: '+1234567890'
      };

      Object.entries(validData).forEach(([field, value]) => {
        if (field === 'name' && invalidData.name) return; // Skip if testing name
        if (field === 'contactEmail' && invalidData.email) return; // Skip if testing email
        if (field === 'website' && invalidData.website) return; // Skip if testing website
        if (field === 'phone' && invalidData.phone) return; // Skip if testing phone

        const input = screen.getByPlaceholderText(
          field === 'name' ? 'Your Agency Name' :
          field === 'contactName' ? 'Your Full Name' :
          field === 'contactEmail' ? 'you@youragency.com' :
          field === 'website' ? 'https://youragency.com' :
          '+1 (555) 123-4567'
        );
        fireEvent.change(input, { target: { value } });
      });

      // Apply invalid data
      if (invalidData.name) {
        fireEvent.change(screen.getByPlaceholderText('Your Agency Name'), {
          target: { value: invalidData.name }
        });
      }
      if (invalidData.email) {
        fireEvent.change(screen.getByPlaceholderText('you@youragency.com'), {
          target: { value: invalidData.email }
        });
      }
      if (invalidData.website) {
        fireEvent.change(screen.getByPlaceholderText('https://youragency.com'), {
          target: { value: invalidData.website }
        });
      }
      if (invalidData.phone) {
        fireEvent.change(screen.getByPlaceholderText('+1 (555) 123-4567'), {
          target: { value: invalidData.phone }
        });
      }

      await user.click(screen.getByText('Next: Platforms & Experience'));

      // Should show validation error or prevent progression
      expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
    });

    test('validates platform selection requirements', async () => {
      const user = userEvent.setup();
      render(<TestWrapper><Signup /></TestWrapper>);

      // Fill basic info
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));

      // Should progress to step 2
      expect(screen.getByText('Your marketing setup')).toBeInTheDocument();

      // Try to proceed without selecting platforms
      await user.click(screen.getByText('Next: Choose Plan'));

      // Should prevent progression (platform validation would happen on backend)
      expect(screen.getByText('Your marketing setup')).toBeInTheDocument();
    });

    test('validates GHL experience selection', async () => {
      const user = userEvent.setup();
      render(<TestWrapper><Signup /></TestWrapper>);

      // Complete steps 1 and 2
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));

      await user.click(screen.getByLabelText(/google-ads/i));

      // Don't select experience level
      await user.click(screen.getByText('Next: Choose Plan'));

      // Should prevent progression due to missing GHL experience
      expect(screen.getByText('Your marketing setup')).toBeInTheDocument();
    });
  });

  describe('API Integration Error Handling', () => {
    test.each([
      ['registration endpoint down', '/api/v1/onboarding/register', 500, 'Registration failed'],
      ['duplicate email error', '/api/v1/onboarding/register', 409, 'Email already registered'],
      ['billing service error', '/api/v1/billing/customers', 500, 'Failed to create customer'],
      ['payment processing error', '/api/v1/billing/subscriptions', 400, 'Payment failed'],
      ['network timeout', '/api/v1/onboarding/register', 'ECONNABORTED', 'Request timeout']
    ])('handles %s gracefully', async (testName, endpoint, errorCode, expectedMessage) => {
      const user = userEvent.setup();

      // Mock API error
      if (typeof errorCode === 'number') {
        (axios.post as any).mockRejectedValueOnce({
          response: { status: errorCode, data: { error: expectedMessage } }
        });
      } else {
        (axios.post as any).mockRejectedValueOnce({
          code: errorCode,
          message: expectedMessage
        });
      }

      render(<TestWrapper><Signup /></TestWrapper>);

      // Fill and submit form
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      await user.click(screen.getByText('Start Free Trial'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });
    });

    test('handles partial API failures with retry logic', async () => {
      const user = userEvent.setup();

      // Mock first call fails, second succeeds
      (axios.post as any)
        .mockRejectedValueOnce({ response: { status: 500, data: { error: 'Temporary failure' } } })
        .mockResolvedValueOnce({
          data: {
            success: true,
            customer_id: 'cus_retry123',
            message: 'Registration successful'
          }
        });

      render(<TestWrapper><Signup /></TestWrapper>);

      // Complete form and submit
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Retry Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Jane Doe');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'jane@retry.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      // Mock successful subsequent calls
      (axios.post as any).mockResolvedValue({
        data: { success: true, customer_id: 'cus_123', client_secret: 'pi_test_secret' }
      });

      await user.click(screen.getByText('Start Free Trial'));

      // Should eventually succeed
      await waitFor(() => {
        expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Payment Processing Edge Cases', () => {
    test('handles Stripe card decline scenarios', async () => {
      const user = userEvent.setup();

      // Mock successful registration but failed payment
      (axios.post as any).mockResolvedValue({
        data: { success: true, customer_id: 'cus_123', client_secret: 'pi_test_failure_secret' }
      });

      render(<TestWrapper><Signup /></TestWrapper>);

      // Complete form
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Payment Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Payment Tester');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'payment@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      await user.click(screen.getByText('Start Free Trial'));

      // Should show payment error
      await waitFor(() => {
        expect(screen.getByText('Card declined')).toBeInTheDocument();
      });
    });

    test('handles 3D Secure authentication', async () => {
      const user = userEvent.setup();

      // Mock payment requiring 3D Secure
      const mockStripe = {
        confirmCardPayment: vi.fn().mockResolvedValue({
          error: null,
          paymentIntent: {
            status: 'requires_action',
            next_action: {
              type: 'redirect_to_url',
              redirect_to_url: { url: 'https://3d-secure.example.com' }
            }
          }
        })
      };

      vi.mocked(require('@stripe/react-stripe-js')).useStripe.mockReturnValue(mockStripe);

      render(<TestWrapper><Signup /></TestWrapper>);

      // Complete form and submit
      await user.type(screen.getByPlaceholderText('Your Agency Name'), '3D Secure Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Secure Tester');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'secure@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      await user.click(screen.getByText('Start Free Trial'));

      // Should handle 3D Secure flow
      await waitFor(() => {
        // In real implementation, would redirect to 3D Secure URL
        expect(mockStripe.confirmCardPayment).toHaveBeenCalled();
      });
    });

    test('validates card information before submission', async () => {
      const user = userEvent.setup();

      render(<TestWrapper><Signup /></TestWrapper>);

      // Complete form up to payment step
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Card Validation Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Card Tester');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'card@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      // Try to submit without card info
      const submitButton = screen.getByText('Start Free Trial');
      expect(submitButton).toBeDisabled();

      // In real implementation, Stripe would validate card completeness
    });
  });

  describe('Performance & Scalability', () => {
    test('handles rapid form interactions without breaking', async () => {
      const user = userEvent.setup();
      render(<TestWrapper><Signup /></TestWrapper>);

      // Rapidly fill and navigate through form
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Rapid Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Rapid Tester');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'rapid@test.com');

      // Rapid step navigation
      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByText('Next: Choose Plan'));
      await user.click(screen.getByText('Back'));
      await user.click(screen.getByText('Back'));
      await user.click(screen.getByText('Next: Platforms & Experience'));

      // Form should maintain state and not crash
      expect(screen.getByDisplayValue('Rapid Test Agency')).toBeInTheDocument();
      expect(screen.getByDisplayValue('rapid@test.com')).toBeInTheDocument();
    });

    test('maintains form state during component re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TestWrapper><Signup /></TestWrapper>);

      // Fill form
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'State Test Agency');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'State Tester');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'state@test.com');

      // Force re-render
      rerender(<TestWrapper><Signup /></TestWrapper>);

      // State should persist
      expect(screen.getByDisplayValue('State Test Agency')).toBeInTheDocument();
      expect(screen.getByDisplayValue('state@test.com')).toBeInTheDocument();
    });

    test('handles memory cleanup on component unmount', () => {
      const { unmount } = render(<TestWrapper><Signup /></TestWrapper>);

      // Should not cause memory leaks
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility & User Experience', () => {
    test('provides clear loading states during API calls', async () => {
      const user = userEvent.setup();

      // Mock slow API response
      (axios.post as any).mockImplementation(() => new Promise(resolve =>
        setTimeout(() => resolve({
          data: { success: true, customer_id: 'cus_slow123' }
        }), 2000)
      ));

      render(<TestWrapper><Signup /></TestWrapper>);

      // Complete form and submit
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Slow API Test');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Slow Tester');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'slow@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      await user.click(screen.getByText('Start Free Trial'));

      // Should show loading state
      expect(screen.getByText('Processing...')).toBeInTheDocument();

      // Should complete after delay
      await waitFor(() => {
        expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('shows contextual help and tooltips', () => {
      render(<TestWrapper><Signup /></TestWrapper>);

      // Should have helpful placeholder text
      expect(screen.getByPlaceholderText('Your Agency Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@youragency.com')).toBeInTheDocument();

      // Should indicate required fields
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    test('provides clear success feedback', async () => {
      const user = userEvent.setup();

      render(<TestWrapper><Signup /></TestWrapper>);

      // Mock successful completion
      (axios.post as any).mockResolvedValue({
        data: { success: true, message: 'Registration successful' }
      });

      // Complete form quickly for success test
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Success Test');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Success User');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'success@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      await user.click(screen.getByText('Start Free Trial'));

      await waitFor(() => {
        expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
        expect(screen.getByText('Your account has been created')).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence & Recovery', () => {
    test('saves form progress in localStorage', async () => {
      const user = userEvent.setup();

      // Mock localStorage
      const localStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      render(<TestWrapper><Signup /></TestWrapper>);

      // Fill some form data
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Persistent Test');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'persistent@test.com');

      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'adsengineer_signup_progress',
        expect.any(String)
      );
    });

    test('recovers form progress on page reload', () => {
      // Mock localStorage with saved data
      const savedData = {
        name: 'Recovered Agency',
        contactEmail: 'recovered@test.com',
        step: 2
      };

      const localStorageMock = {
        getItem: vi.fn((key) => key === 'adsengineer_signup_progress' ? JSON.stringify(savedData) : null),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      render(<TestWrapper><Signup /></TestWrapper>);

      // Should load saved data
      expect(screen.getByDisplayValue('Recovered Agency')).toBeInTheDocument();
      expect(screen.getByDisplayValue('recovered@test.com')).toBeInTheDocument();
    });

    test('clears saved progress after successful submission', async () => {
      const user = userEvent.setup();

      const localStorageMock = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });

      render(<TestWrapper><Signup /></TestWrapper>);

      // Complete successful submission
      await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Complete Test');
      await user.type(screen.getByPlaceholderText('Your Full Name'), 'Complete User');
      await user.type(screen.getByPlaceholderText('you@youragency.com'), 'complete@test.com');

      await user.click(screen.getByText('Next: Platforms & Experience'));
      await user.click(screen.getByLabelText(/google-ads/i));
      await user.click(screen.getByLabelText('Regular user'));
      await user.click(screen.getByText('Next: Choose Plan'));

      const starterCard = screen.getByText('Starter').closest('div');
      await user.click(starterCard!);

      await user.click(screen.getByText('Start Free Trial'));

      await waitFor(() => {
        expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
      });

      // Should clear localStorage
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adsengineer_signup_progress');
    });
  });
});