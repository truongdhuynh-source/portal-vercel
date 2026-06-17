import { normalizeTeraTrackingEvents } from "../utils/teraTracking";
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = import.meta.env.VITE_APP_TERA_TRACKING;
const API_KEY = import.meta.env.VITE_TRACKING_API_KEY;

const createHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  'X-Trace-ID': uuidv4(),
});

const postEvent = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/event`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Send tracking event failed: ${response.status}`);
    }

    return response;
  } catch { }
};

const postEvents = (payload) => {
  const events = normalizeTeraTrackingEvents(payload);

  return Promise.all(events.map(postEvent));
};

const postBatchEvents = async (payload) => {
  const events = normalizeTeraTrackingEvents(payload);
  const response = await fetch(`${BASE_URL}/event?batch=1`, {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify(events),
  });

  if (!response.ok) {
    throw new Error(`Send tracking batch events failed: ${response.status}`);
  }

  return response;
};

export const trackingService = {
  async sendEvent(payload) {
    const responses = await postEvents(payload);

    return Array.isArray(payload) ? responses : responses[0];
  },

  async sendEvents(payload) {
    return postBatchEvents(payload);
  },

  async sendBatch(events = []) {
    return postBatchEvents(events);
  },

  async sendMetric(payload) {
    return fetch(`${BASE_URL}/metric`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(payload),
    });
  },

  sendOnUnload(events) {
    fetch(`${BASE_URL}/event?batch=1`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify(events),
      keepalive: true,
    });
  },
};
