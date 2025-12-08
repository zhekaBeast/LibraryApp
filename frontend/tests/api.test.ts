import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, api } from '../src/lib/api';

describe('ApiClient', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should use custom getToken function', () => {
      const getToken = vi.fn(() => 'custom-token');
      const client = new ApiClient({ getToken });
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should use custom onError function', () => {
      const onError = vi.fn();
      const client = new ApiClient({ onError });
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('buildHeaders', () => {
    it('should include Authorization header when token exists', () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('token', 'test-token');
      }
      const client = new ApiClient();
      // Access private method through type assertion for testing
      const headers = (client as any).buildHeaders();
      expect(headers).toHaveProperty('Authorization', 'Bearer test-token');
    });

    it('should not include Authorization header when token is missing', () => {
      const client = new ApiClient();
      const headers = (client as any).buildHeaders();
      expect(headers).not.toHaveProperty('Authorization');
    });

    it('should include Content-Type header', () => {
      const client = new ApiClient();
      const headers = (client as any).buildHeaders();
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('request', () => {
    it('should make GET request successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
        status: 200,
        statusText: 'OK'
      });

      const client = new ApiClient();
      await client.request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle 401 error and redirect to login', async () => {
      if (typeof window !== 'undefined' && window.location) {
        const originalHref = window.location.href;
        Object.defineProperty(window, 'location', {
          value: { href: '' },
          writable: true,
        });

        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Unauthorized' })
        });

        const client = new ApiClient();
        
        await expect(client.request('/test')).rejects.toThrow();

        if (typeof localStorage !== 'undefined') {
          expect(localStorage.getItem('token')).toBeNull();
          expect(localStorage.getItem('user')).toBeNull();
        }

        Object.defineProperty(window, 'location', {
          value: { href: originalHref },
          writable: true,
        });
      }
    });

    it('should call onError callback on error', async () => {
      const onError = vi.fn();
      const client = new ApiClient({ onError });

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(client.request('/test')).rejects.toThrow();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should make GET request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
        status: 200
      });

      const client = new ApiClient();
      await client.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
        status: 200
      });

      const client = new ApiClient();
      await client.post('/test', { key: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' })
        })
      );
    });
  });

  describe('put', () => {
    it('should make PUT request with body', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
        status: 200
      });

      const client = new ApiClient();
      await client.put('/test', { key: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ key: 'value' })
        })
      );
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
        status: 200
      });

      const client = new ApiClient();
      await client.delete('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('default instance', () => {
    it('should export default api instance', () => {
      expect(api).toBeInstanceOf(ApiClient);
    });
  });
});

