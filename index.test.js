import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as core from '@actions/core';
import fetch from 'node-fetch';

// Mock the modules
vi.mock('@actions/core');
vi.mock('node-fetch');

describe('PostHog Annotation GitHub Action', () => {
  let mockFetch;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup console spies
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup default mock responses
    mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ id: 123, content: 'test annotation' })
    });
    fetch.mockImplementation(mockFetch);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should create a project-level annotation when dashboard-item is not provided', async () => {
    // Setup inputs
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'posthog-project-id': '12345',
        'posthog-token': 'test-token',
        'posthog-api-host': 'https://app.posthog.com',
        'annotation-message': 'Test annotation message',
        'dashboard-id': '' // Empty string means not provided
      };
      return inputs[name] || '';
    });

    // Import and execute the action
    await import('./index.js');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://app.posthog.com/api/projects/12345/annotations/',
      expect.objectContaining({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token'
        }
      })
    );

    // Verify the request body
    const callArgs = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);
    
    expect(requestBody.scope).toBe('project');
    expect(requestBody.content).toBe('Test annotation message');
    expect(requestBody.creation_type).toBe('GIT');
    expect(requestBody.date_marker).toBeDefined();
    expect(requestBody.dashboard_id).toBeUndefined();
  });

  it('should create a dashboard-item scoped annotation when dashboard-item is provided', async () => {
    // Clear the module cache to re-import
    vi.resetModules();

    // Setup inputs with dashboard-item
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'posthog-project-id': '12345',
        'posthog-token': 'test-token',
        'posthog-api-host': 'https://app.posthog.com',
        'annotation-message': 'Dashboard annotation',
        'dashboard-id': '67890'
      };
      return inputs[name] || '';
    });

    // Re-import the action
    await import('./index.js?t=' + Date.now());

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify fetch was called
    expect(mockFetch).toHaveBeenCalled();

    // Verify the request body
    const callArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    const requestBody = JSON.parse(callArgs[1].body);
    
    expect(requestBody.scope).toBe('dashboard');
    expect(requestBody.content).toBe('Dashboard annotation');
    expect(requestBody.creation_type).toBe('GIT');
    expect(requestBody.date_marker).toBeDefined();
    expect(requestBody.dashboard_id).toBe(67890);
  });

  it('should handle API errors gracefully', async () => {
    // Clear the module cache
    vi.resetModules();

    // Setup inputs
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'posthog-project-id': '12345',
        'posthog-token': 'test-token',
        'posthog-api-host': 'https://app.posthog.com',
        'annotation-message': 'Test annotation',
        'dashboard-id': ''
      };
      return inputs[name] || '';
    });

    // Mock fetch to reject
    mockFetch.mockRejectedValue(new Error('API Error'));

    // Re-import the action
    await import('./index.js?t=' + Date.now());

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('error', expect.any(Error));
  });

  it('should use custom API host when provided', async () => {
    // Clear the module cache
    vi.resetModules();

    // Setup inputs with custom host
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'posthog-project-id': '12345',
        'posthog-token': 'test-token',
        'posthog-api-host': 'https://custom.posthog.com',
        'annotation-message': 'Test annotation',
        'dashboard-id': ''
      };
      return inputs[name] || '';
    });

    // Re-import the action
    await import('./index.js?t=' + Date.now());

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify fetch was called with custom host
    const callArgs = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    expect(callArgs[0]).toContain('https://custom.posthog.com');
  });
});
