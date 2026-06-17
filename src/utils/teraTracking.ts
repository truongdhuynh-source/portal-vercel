import getUserIdLogin from "./getUserIdLogin";

const STORAGE_KEY = "tracking_queue";
const ENCRYPTED_STORAGE_PREFIX = "enc:v1:";
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
const DEFAULT_CLIENT_ID = import.meta.env.VITE_TRACKING_CLIENT_ID || "";
const MAX_QUEUE_SIZE = 500;
const STORAGE_SALT_SIZE = 16;

type TeraTrackingMeta = Record<string, unknown>;

export type TeraTrackingEvent = {
  event: string;
  meta: TeraTrackingMeta;
  value: number;
  userId?: string;
  clientId?: string;
  timestamp: string;
  timezone: string;
};

type TeraTrackingEventInput =
  | string
  | (Partial<TeraTrackingEvent> & {
      event: string;
      [key: string]: unknown;
    });

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizeText = (value: unknown) => {
  if (value === undefined || value === null) return undefined;

  const text = String(value).trim();

  return text || undefined;
};

const getTrackingStorageSecret = () => {
  return (
    normalizeText(import.meta.env.VITE_TRACKING_STORAGE_SECRET) ||
    normalizeText(import.meta.env.VITE_APP_SECRET_KEY) ||
    `${DEFAULT_CLIENT_ID}:${window.location.hostname}:tera-tracking`
  );
};

const hashString = (value: string, seed = 2166136261) => {
  let hash = seed >>> 0;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash || 2166136261;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }

  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const createStorageSalt = () => {
  const salt = new Uint8Array(STORAGE_SALT_SIZE);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(salt);

    return salt;
  }

  for (let index = 0; index < salt.length; index += 1) {
    salt[index] = Math.floor(Math.random() * 256);
  }

  return salt;
};

const transformStorageBytes = (bytes: Uint8Array, salt: Uint8Array) => {
  const saltKey = bytesToBase64(salt);
  const secret = getTrackingStorageSecret();
  const transformedBytes = new Uint8Array(bytes.length);
  let state = hashString(`${secret}:${saltKey}`);

  for (let index = 0; index < bytes.length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    transformedBytes[index] = bytes[index] ^ (state & 0xff);
  }

  return transformedBytes;
};

const encodeTrackingQueue = (events: TeraTrackingEvent[]) => {
  const salt = createStorageSalt();
  const bytes = new TextEncoder().encode(JSON.stringify(events));
  const encryptedBytes = transformStorageBytes(bytes, salt);

  return `${ENCRYPTED_STORAGE_PREFIX}${bytesToBase64(salt)}.${bytesToBase64(
    encryptedBytes,
  )}`;
};

const decodeTrackingQueue = (data: string) => {
  if (!data.startsWith(ENCRYPTED_STORAGE_PREFIX)) {
    return data;
  }

  const payload = data.slice(ENCRYPTED_STORAGE_PREFIX.length);
  const separatorIndex = payload.indexOf(".");

  if (separatorIndex < 0) {
    throw new Error("Invalid encrypted tracking queue");
  }

  const salt = base64ToBytes(payload.slice(0, separatorIndex));
  const encryptedBytes = base64ToBytes(payload.slice(separatorIndex + 1));
  const bytes = transformStorageBytes(encryptedBytes, salt);

  return new TextDecoder().decode(bytes);
};

const getTrackingQueue = (): TeraTrackingEvent[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return [];

    const parsedData = JSON.parse(decodeTrackingQueue(data));

    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Get tracking events error:", error);
    return [];
  }
};

export const normalizeTeraTrackingEvent = (
  eventInput: TeraTrackingEventInput,
): TeraTrackingEvent => {
  const currentUserId = normalizeText(getUserIdLogin());

  if (typeof eventInput === "string") {
    const event = normalizeText(eventInput);

    if (!event) {
      throw new Error("Tracking event name is required");
    }

    return {
      event,
      meta: {},
      value: 1,
      userId: currentUserId,
      clientId: DEFAULT_CLIENT_ID,
      timestamp: new Date().toISOString(),
      timezone: DEFAULT_TIMEZONE,
    };
  }

  const {
    event,
    meta,
    value,
    userId,
    clientId,
    timestamp,
    timezone,
    ...metaFields
  } = eventInput;

  const eventName = normalizeText(event);

  if (!eventName) {
    throw new Error("Tracking event name is required");
  }

  return {
    event: eventName,
    meta: {
      ...metaFields,
      ...(isObject(meta) ? meta : {}),
    },
    value: typeof value === "number" && Number.isFinite(value) ? value : 1,
    userId: normalizeText(userId) || currentUserId,
    clientId: normalizeText(clientId) || DEFAULT_CLIENT_ID,
    timestamp: normalizeText(timestamp) || new Date().toISOString(),
    timezone: normalizeText(timezone) || DEFAULT_TIMEZONE,
  };
};

export const normalizeTeraTrackingEvents = (
  eventInput: TeraTrackingEventInput | TeraTrackingEventInput[],
): TeraTrackingEvent[] => {
  return (Array.isArray(eventInput) ? eventInput : [eventInput]).map(
    normalizeTeraTrackingEvent,
  );
};

export const getTeraTrackingInSession = () => {
  return compactTrackingQueue(getTrackingQueue());
};

export const setTeraTrackingInSession = (events: TeraTrackingEvent[]) => {
  try {
    const eventsToSave = events.slice(-MAX_QUEUE_SIZE);

    if (!eventsToSave.length) {
      localStorage.removeItem(STORAGE_KEY);

      return;
    }

    localStorage.setItem(STORAGE_KEY, encodeTrackingQueue(eventsToSave));
  } catch (error) {
    console.error("Set tracking events error:", error);
  }
};

const normalizeObjectForCompare = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeObjectForCompare);
  }

  if (!isObject(value)) {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      const item = value[key];

      if (item !== undefined) {
        acc[key] = normalizeObjectForCompare(item);
      }

      return acc;
    }, {});
};

const createTrackingAggregationKey = (event: TeraTrackingEvent) => {
  return JSON.stringify({
    event: event.event,
    meta: normalizeObjectForCompare(event.meta),
    userId: event.userId,
    clientId: event.clientId,
    timezone: event.timezone,
  });
};

const compactTrackingQueue = (events: TeraTrackingEvent[]) => {
  return events.reduce<TeraTrackingEvent[]>((result, event) => {
    try {
      const normalizedEvent = normalizeTeraTrackingEvent(event);
      const aggregationKey = createTrackingAggregationKey(normalizedEvent);
      const existingEventIndex = result.findIndex(
        (currentEvent) =>
          createTrackingAggregationKey(currentEvent) === aggregationKey,
      );

      if (existingEventIndex >= 0) {
        result[existingEventIndex] = {
          ...result[existingEventIndex],
          value: result[existingEventIndex].value + normalizedEvent.value,
          timestamp: normalizedEvent.timestamp,
        };
      } else {
        result.push(normalizedEvent);
      }
    } catch (error) {
      console.error("Compact tracking event error:", error);
    }

    return result;
  }, []);
};

export const createTeraTrackingPageMeta = (
  page: string,
  meta: TeraTrackingMeta = {},
) => ({
  page,
  path: window.location.pathname,
  ...meta,
});

export const createEventToTrackingSession = (event: TeraTrackingEventInput) => {
  try {
    const currentTracking = compactTrackingQueue(getTrackingQueue());
    const normalizedEvent = normalizeTeraTrackingEvent(event);
    const aggregationKey = createTrackingAggregationKey(normalizedEvent);
    const existingEventIndex = currentTracking.findIndex(
      (currentEvent) =>
        createTrackingAggregationKey(currentEvent) === aggregationKey,
    );

    if (existingEventIndex >= 0) {
      currentTracking[existingEventIndex] = {
        ...currentTracking[existingEventIndex],
        value:
          currentTracking[existingEventIndex].value + normalizedEvent.value,
        timestamp: normalizedEvent.timestamp,
      };
    } else {
      currentTracking.push(normalizedEvent);
    }

    setTeraTrackingInSession(currentTracking);
  } catch (error) {
    console.error("Create tracking event error:", error);
  }
};

export const removeEventFromTrackingSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Remove tracking event error:", error);
  }
};
