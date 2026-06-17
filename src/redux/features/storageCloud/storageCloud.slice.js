import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/plugins/axios";
import { STORAGE_PROVIDER_META } from "@/constants";

const normalizeProviderKey = (provider) => {
  const normalized = String(provider || "")
    .toLowerCase()
    .replace(/-/g, "_");
  return normalized === "webdav" ? "web_dav" : normalized;
};

export const fetchStorageConnections = createAsyncThunk(
  "storageCloud/fetchConnections",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("storage/list-connections");

      const connectionMap = data.reduce((acc, conn) => {
        const provider = normalizeProviderKey(conn.provider);
        (acc[provider] ??= []).push({
          id: conn.id,
          userId: conn.appUserId,
          email: conn.providerEmail,
        });
        return acc;
      }, {});

      Object.entries(connectionMap).forEach(([provider, accounts]) => {
        accounts.forEach((acc) => {
          dispatch(
            fetchStorageMe({
              provider,
              connectionId: acc.id,
            }),
          );
        });
      });

      return connectionMap;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const fetchStorageMe = createAsyncThunk(
  "storageCloud/fetchMe",
  async ({ provider, connectionId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `storage/${provider}/${connectionId}/me`,
      );
      return {
        provider,
        connectionId,
        me: data,
      };
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const connectStorageProvider = createAsyncThunk(
  "storageCloud/connectProvider",
  async ({ providerKey, redirect }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `storage/${providerKey}/connect`,
        { params: { redirect } },
      );
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const connectWebDavStorageProvider = createAsyncThunk(
  "storageCloud/connectWebDavProvider",
  async (
    { providerKey = "web_dav", baseUrl, username, password },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await axiosInstance.post(
        `storage/${providerKey}/connect`,
        {
          baseUrl,
          username,
          password,
        },
      );
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const connectOcisStorageProvider = createAsyncThunk(
  "storageCloud/connectOcisProvider",
  async (
    {
      accessToken,
      clientId,
      expiresIn,
      redirectUri,
      refreshToken,
      serverUrl,
      tokenEndpoint,
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await axiosInstance.post("storage/ocis/connect", {
        accessToken,
        clientId,
        expiresIn,
        redirectUri,
        refreshToken,
        serverUrl,
        tokenEndpoint,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

export const revokeConnection = createAsyncThunk(
  "storageCloud/revokeConnection",
  async ({ connectionId }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(removeAccount(connectionId));
      return axiosInstance.delete(`storage/revoke-connection/${connectionId}`);
    } catch (err) {
      return rejectWithValue(err);
    }
  },
);

const providers = Object.entries(STORAGE_PROVIDER_META).map(([key, value]) => ({
  key,
  title: value.title,
  accounts: [],
}));

const initialState = {
  loading: false,
  providers,
};

const storageCloudSlice = createSlice({
  name: "storageCloud",
  initialState,
  reducers: {
    removeAccount(state, action) {
      const accountId = action.payload;
      state.providers.forEach((p) => {
        p.accounts = p.accounts.filter((a) => a.id !== accountId);
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStorageConnections.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStorageConnections.fulfilled, (state, action) => {
        const map = action.payload;
        state.providers = state.providers.map((provider) => ({
          ...provider,
          accounts: map[provider.key] ?? [],
        }));

        state.loading = false;
      })
      .addCase(fetchStorageConnections.rejected, (state) => {
        state.loading = false;
      })
      .addCase(connectStorageProvider.pending, (state) => {
        state.loading = true;
      })
      .addCase(connectStorageProvider.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(connectStorageProvider.rejected, (state) => {
        state.loading = false;
      })
      .addCase(connectWebDavStorageProvider.pending, (state) => {
        state.loading = true;
      })
      .addCase(connectWebDavStorageProvider.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(connectWebDavStorageProvider.rejected, (state) => {
        state.loading = false;
      })
      .addCase(connectOcisStorageProvider.pending, (state) => {
        state.loading = true;
      })
      .addCase(connectOcisStorageProvider.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(connectOcisStorageProvider.rejected, (state) => {
        state.loading = false;
      })

      .addCase(fetchStorageMe.fulfilled, (state, action) => {
        const { provider, connectionId, me } = action.payload;

        const targetProvider = state.providers.find((p) => p.key === provider);

        if (!targetProvider) return;

        const account = targetProvider.accounts.find(
          (a) => a.id === connectionId,
        );

        if (account) {
          account.me = me;
        }
      });
  },
});

export const { removeAccount } = storageCloudSlice.actions;
export default storageCloudSlice.reducer;
