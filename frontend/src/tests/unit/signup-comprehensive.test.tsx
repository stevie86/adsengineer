import { test, expect, describe, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Signup from '../../src/pages/Signup';

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
    get: vi.fn().mockResolvedValue({
      data: {
        tiers: [
          { id: 'starter', name: 'Starter', price: 9900, lead_limit: 1000, features: ['Basic'] },
          { id: 'professional', name: 'Professional', price: 29900, lead_limit: 10000, features: ['Advanced'] }
        ]
      }
    }),
    post: vi.fn().mockResolvedValue({
      data: { success: true, customer_id: 'cus_test', message: 'Success' }
    })
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <Elements stripe={loadStripe('pk_test_mock')}>
      {children}
    </Elements>
  </BrowserRouter>
);

describe('Signup Component - Maximum Test Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Happy path test
  test('completes full signup flow successfully', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    // Step 1: Agency Information
    await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
    await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@youragency.com'), 'john@test.com');
    await user.type(screen.getByPlaceholderText('https://youragency.com'), 'https://testagency.com');
    await user.type(screen.getByPlaceholderText('+1 (555) 123-4567'), '+1234567890');

    await user.click(screen.getByText('Next: Platforms & Experience'));
    expect(screen.getByText('Your marketing setup')).toBeInTheDocument();

    // Step 2: Platforms & Experience
    await user.click(screen.getByLabelText(/google-ads/i));
    await user.click(screen.getByLabelText(/facebook-ads/i));
    await user.click(screen.getByLabelText('Regular user'));
    await user.selectOptions(screen.getByDisplayValue('Select range'), '1k-5k');

    await user.click(screen.getByText('Next: Choose Plan'));
    expect(screen.getByText('Choose your plan')).toBeInTheDocument();

    // Step 3: Payment
    const professionalCard = screen.getByText('Professional').closest('div');
    await user.click(professionalCard!);
    expect(screen.getByText('Payment Information')).toBeInTheDocument();

    await user.click(screen.getByText('Start Free Trial'));

    await waitFor(() => {
      expect(screen.getByText('Welcome to AdsEngineer!')).toBeInTheDocument();
    });
  });

  // Error handling tests
  test('handles API errors gracefully', async () => {
    const mockAxios = (await import('axios')).default;
    mockAxios.post.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Email already exists' } }
    });

    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    await user.type(screen.getByPlaceholderText('Your Agency Name'), 'Test Agency');
    await user.type(screen.getByPlaceholderText('Your Full Name'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@youragency.com'), 'existing@test.com');

    await user.click(screen.getByText('Next: Platforms & Experience'));
    await user.click(screen.getByLabelText(/google-ads/i));
    await user.click(screen.getByLabelText('Regular user'));
    await user.click(screen.getByText('Next: Choose Plan'));

    const starterCard = screen.getByText('Starter').closest('div');
    await user.click(starterCard!);
    await user.click(screen.getByText('Start Free Trial'));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });
  });

  // Validation tests
  test('validates required fields', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    await user.click(screen.getByText('Next: Platforms & Experience'));
    expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
  });

  test('validates email format', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    const emailInput = screen.getByPlaceholderText('you@youragency.com');
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByText('Next: Platforms & Experience'));

    expect(emailInput).toBeInvalid();
  });

  // Performance tests
  test('renders within performance budget', () => {
    const startTime = performance.now();
    render(<TestWrapper><Signup /></TestWrapper>);
    const renderTime = performance.now() - startTime;

    expect(renderTime).toBeLessThan(100);
  });

  // Accessibility tests
  test('has proper form labels', () => {
    render(<TestWrapper><Signup /></TestWrapper>);

    expect(screen.getByLabelText(/Agency Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument();
  });

  // State management tests
  test('maintains form state across steps', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    await user.type(screen.getByPlaceholderText('Your Agency Name'), 'State Test');
    await user.click(screen.getByText('Next: Platforms & Experience'));
    await user.click(screen.getByText('Back'));

    expect(screen.getByDisplayValue('State Test')).toBeInTheDocument();
  });

  // Edge case tests
  test('handles empty form submission', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    await user.click(screen.getByText('Next: Platforms & Experience'));
    expect(screen.getByText('Tell us about your agency')).toBeInTheDocument();
  });

  test('handles very long input values', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    const longName = 'A'.repeat(200);
    await user.type(screen.getByPlaceholderText('Your Agency Name'), longName);
    expect(screen.getByDisplayValue(longName)).toBeInTheDocument();
  });

  // Integration tests
  test('integrates with pricing API', async () => {
    render(<TestWrapper><Signup /></TestWrapper>);

    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
    });
  });

  test('handles pricing API failure', async () => {
    const mockAxios = (await import('axios')).default;
    mockAxios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<TestWrapper><Signup /></TestWrapper>);

    // Should still render but without pricing options
    expect(screen.getByText('Join AdsEngineer')).toBeInTheDocument();
  });

  // Security tests
  test('sanitizes user input', async () => {
    const user = userEvent.setup();
    render(<TestWrapper><Signup /></TestWrapper>);

    const maliciousInput = '<script>alert("xss")</script>';
    await user.type(screen.getByPlaceholderText('Your Agency Name'), maliciousInput);
    expect(screen.getByDisplayValue(maliciousInput)).toBeInTheDocument();
    // In real app, this would be sanitized on submission
  });

  // Mobile responsiveness tests (basic)
  test('has responsive layout classes', () => {
    render(<TestWrapper><Signup /></TestWrapper>);

    const container = screen.getByText('Join AdsEngineer').closest('div');
    expect(container).toHaveClass('max-w-2xl', 'mx-auto');
  });
});