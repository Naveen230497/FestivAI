/**
 * API client for FestivAI backend service
 */

/**
 * Send a plan generation request to the server.
 * @param {Record<string, any>} payload
 * @returns {Promise<{ ok: boolean, data?: any, error?: string, status?: number }>}
 */
export async function requestPlan(payload) {
  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    let result = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (response.ok) {
      return { ok: true, data: result, status };
    }

    if (status === 422) {
      return { ok: false, error: result?.detail || 'Input validation failed.', status };
    }

    if (status === 429) {
      return { ok: false, error: result?.detail || 'Too many requests. Please wait a minute and try again.', status };
    }

    if (status === 413) {
      return { ok: false, error: 'Request body is too large.', status };
    }

    return {
      ok: false,
      error: result?.detail || `Server returned error status ${status}.`,
      status,
    };
  } catch (err) {
    if (!navigator.onLine) {
      return { ok: false, error: 'You are currently offline. Please check your internet connection.', status: 0 };
    }
    return { ok: false, error: 'Unable to reach the server. Please check your connection and try again.', status: 0 };
  }
}
