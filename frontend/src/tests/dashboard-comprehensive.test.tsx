import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/Dashboard';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as any;

describe('Dashboard Component', () => {
  const mockUserData = {
    id: 'user-123',
    email: 'user@example.com',
    name: 'John Doe',
    agency: {
      id: 'agency-456',
      name: 'Test Agency',
      plan: 'professional',
      sites: [
        {
          id: 'site-1',
          name: 'E-commerce Store',
          url: 'https://teststore.com',
          status: 'active',
          conversions: 150,
          value: 75000
        },
        {
          id: 'site-2',
          name: 'Lead Gen Site',
          url: 'https://leadsite.com',
          status: 'active',
          conversions: 75,
          value: 25000
        }
      ],
      metrics: {
        totalConversions: 225,
        totalValue: 100000,
        conversionRate: 0.045,
        monthlyGrowth: 12.5
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: { user: mockUserData }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderDashboard = () => {
    return render(<Dashboard />);
  };

  describe('Initial Load', () => {
    it('should render dashboard with user data', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
        expect(screen.getByText('Test Agency')).toBeInTheDocument();
        expect(screen.getByText('Professional Plan')).toBeInTheDocument();
      });
    });

    it('should fetch user data on mount', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/auth/me', {
          headers: {
            'Authorization': expect.stringContaining('Bearer')
          }
        });
      });
    });

    it('should handle loading state', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));
      
      renderDashboard();
      
      expect(screen.getByTestId('dashboard-loader')).toBeInTheDocument();
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { data: { error: 'Unauthorized' } }
      });
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      });
    });
  });

  describe('Metrics Overview', () => {
    it('should display key metrics', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('225')).toBeInTheDocument();
        expect(screen.getByText('$100,000')).toBeInTheDocument();
        expect(screen.getByText('4.5%')).toBeInTheDocument();
        expect(screen.getByText('+12.5%')).toBeInTheDocument();
      });
    });

    it('should show metric descriptions', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Total Conversions')).toBeInTheDocument();
        expect(screen.getByText('Total Value')).toBeInTheDocument();
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
        expect(screen.getByText('Monthly Growth')).toBeInTheDocument();
      });
    });
  });

  describe('Sites Management', () => {
    it('should list user sites', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('E-commerce Store')).toBeInTheDocument();
        expect(screen.getByText('Lead Gen Site')).toBeInTheDocument();
        expect(screen.getByText('https://teststore.com')).toBeInTheDocument();
        expect(screen.getByText('https://leadsite.com')).toBeInTheDocument();
      });
    });

    it('should show site status indicators', async () => {
      renderDashboard();
      
      await waitFor(() => {
        const site1Status = screen.getByTestId('site-1-status');
        const site2Status = screen.getByTestId('site-2-status');
        
        expect(site1Status).toHaveClass('text-green-600');
        expect(site2Status).toHaveClass('text-green-600');
      });
    });

    it('should show site metrics', async () => {
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('150 conversions')).toBeInTheDocument();
        expect(screen.getByText('75 conversions')).toBeInTheDocument();
        expect(screen.getByText('$75,000')).toBeInTheDocument();
        expect(screen.getByText('$25,000')).toBeInTheDocument();
      });
    });

    it('should handle adding new site', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      const addButton = screen.getByRole('button', { name: /Add Site/i });
      await user.click(addButton);
      
      expect(screen.getByText('Add New Site')).toBeInTheDocument();
    });

    it('should handle site deletion', async () => {
      mockedAxios.delete.mockResolvedValue({
        data: { success: true }
      });
      
      const user = userEvent.setup();
      renderDashboard();
      
      const deleteButton = screen.getByTestId('delete-site-1');
      await user.click(deleteButton);
      
      const confirmButton = screen.getByRole('button', { name: /Delete Site/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockedAxios.delete).toHaveBeenCalledWith('/api/v1/sites/site-1', {
          headers: {
            'Authorization': expect.stringContaining('Bearer')
          }
        });
      });
    });

    it('should handle site settings', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      const settingsButton = screen.getByTestId('settings-site-1');
      await user.click(settingsButton);
      
      expect(screen.getByText('Site Settings')).toBeInTheDocument();
      expect(screen.getByText('Tracking Configuration')).toBeInTheDocument();
    });
  });

  describe('Analytics', () => {
    it('should show analytics charts', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/v1/analytics/conversions') {
          return Promise.resolve({
            data: {
              dailyBreakdown: [
                { date: '2026-01-12', conversions: 25, value: 12500 },
                { date: '2026-01-11', conversions: 22, value: 11000 }
              ],
              topEvents: ['purchase', 'signup', 'quote-request']
            }
          });
        }
        return Promise.resolve({ data: { user: mockUserData } });
      });
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByTestId('conversions-chart')).toBeInTheDocument();
        expect(screen.getByTestId('value-chart')).toBeInTheDocument();
      });
    });

    it('should handle date range filtering', async () => {
      const user = userEvent.setup();
      renderDashboard();
      
      const dateRangeButton = screen.getByRole('button', { name: /Date Range/i });
      await user.click(dateRangeButton);
      
      const last30Days = screen.getByText('Last 30 days');
      await user.click(last30Days);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          '/api/v1/analytics/conversions?startDate=2025-12-13&endDate=2026-01-12',
          expect.any(Object)
        );
      });
    });

    it('should export analytics data', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { downloadUrl: 'https://example.com/export.csv' }
      });
      
      const user = userEvent.setup();
      renderDashboard();
      
      const exportButton = screen.getByRole('button', { name: /Export/i });
      await user.click(exportButton);
      
      const csvOption = screen.getByText('Export as CSV');
      await user.click(csvOption);
      
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/v1/analytics/export',
          { format: 'csv', dateRange: { startDate: '2025-12-13', endDate: '2026-01-12' } },
          expect.any(Object)
        );
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should handle WebSocket connection', async () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.WebSocket = vi.fn(() => mockWebSocket) as any;
      
      renderDashboard();
      
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/realtime')
        );
        expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      });
    });

    it('should update metrics on real-time events', async () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      
      global.WebSocket = vi.fn(() => mockWebSocket) as any;
      
      renderDashboard();
      
      await waitFor(() => {
        const eventHandler = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )[1];
        
        const mockEvent = {
          type: 'conversion',
          data: {
            siteId: 'site-1',
            value: 1500,
            timestamp: new Date().toISOString()
          }
        };
        
        eventHandler({ data: JSON.stringify(mockEvent) });
        
        expect(screen.getByText('226')).toBeInTheDocument();
        expect(screen.getByText('$101,500')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show retry option on API failure', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'NETWORK_ERROR'
      });
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Connection failed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should handle partial data loading', async () => {
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/v1/auth/me') {
          return Promise.resolve({
            data: {
              user: { ...mockUserData, sites: null }
            }
          });
        }
        if (url === '/api/v1/sites') {
          return Promise.reject(new Error('Failed to load sites'));
        }
        return Promise.resolve({ data: { user: mockUserData } });
      });
      
      renderDashboard();
      
      await waitFor(() => {
        expect(screen.getByText('Test Agency')).toBeInTheDocument();
        expect(screen.getByText('Failed to load sites')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      
      renderDashboard();
      
      await waitFor(() => {
        const dashboard = screen.getByTestId('dashboard');
        expect(dashboard).toHaveClass('md:hidden', 'lg:block');
      });
    });

    it('should show mobile navigation on small screens', async () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
      
      const user = userEvent.setup();
      renderDashboard();
      
      const mobileMenuButton = screen.getByRole('button', { name: /Menu/i });
      await user.click(mobileMenuButton);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});