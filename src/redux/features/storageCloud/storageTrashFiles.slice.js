import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/plugins/axios";

export const fetchStorageTrashFiles = createAsyncThunk(
  "storageTrashFiles/fetch",
  async (
    { provider, connectionId, nextPage, limit, filter },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await axiosInstance.get(
        `/storage/${provider}/${connectionId}/trash`,
        {
          params: {
            nextPage,
            limit,
            sortBy: filter.sortBy,
            direction: filter.sortDirection,
          },
        },
      );

      dispatch(
        setPage({ nextPage: data.paging.nextPage, limit: data.paging.limit }),
      );

      return {
        items: data.items.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          size: item.size,
          modifiedAt: item.modifiedAt,
          parentId: item.parentId,
        })),

        paging: {
          nextPage: data.paging.nextPage,
          limit,
        },
      };
    } catch (err) {
      if (err?.data?.message === "STORAGE_NOT_CONNECTED") {
        return rejectWithValue("STORAGE_NOT_CONNECTED");
      }
      return rejectWithValue("FETCH_FAILED");
    }
  },
);

export const deleteStorageTrashFile = createAsyncThunk(
  "storageTrashFiles/delete",
  async (
    { provider, connectionId, itemId, type },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await axiosInstance.delete(
        `/storage/${provider}/${connectionId}/trash/${type}/${itemId}`,
      );
      dispatch(deleteItem({ itemId }));
      dispatch(removeTrashSelectionItem({ id: itemId }));

      return { itemId };
    } catch (err) {
      if (err?.response?.data?.message === "STORAGE_NOT_CONNECTED") {
        return rejectWithValue("STORAGE_NOT_CONNECTED");
      }
      return rejectWithValue("DELETE_FAILED");
    }
  },
);

export const restoreStorageTrashFile = createAsyncThunk(
  "storageTrashFiles/restore",
  async (
    { provider, connectionId, itemId, type, folderId },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await axiosInstance.post(
        `/storage/${provider}/${connectionId}/trash/${type}/${itemId}/restore`,
        {
          folderId,
        },
      );

      dispatch(deleteItem({ itemId }));
      dispatch(removeTrashSelectionItem({ id: itemId }));

      return { itemId };
    } catch (err) {
      if (err?.response?.data?.message === "STORAGE_NOT_CONNECTED") {
        return rejectWithValue("STORAGE_NOT_CONNECTED");
      }
      return rejectWithValue("RESTORE_FAILED");
    }
  },
);

const initialState = {
  connectionId: null,
  currentRequestId: undefined,
  currentFolderId: null,
  items: [],
  path: [],
  paging: {
    nextPage: null,
    limit: 100,
  },
  filter: {
    sortBy: "date",
    sortDirection: "DESC",
  },
  loading: false,
  error: null,
  storageDisconnected: false,
  selections: [],
};

const storageTrashFilesSlice = createSlice({
  name: "storageTrashFiles",
  initialState,
  reducers: {
    resetStorageTrashFileState(state, action) {
      const newConnectionId = action.payload.connectionId;
      if (newConnectionId !== state.connectionId) {
        Object.assign(state, initialState);
        state.connectionId = newConnectionId;
      }
    },
    setCurrentFolderId(state, action) {
      state.currentFolderId = action.payload;
    },

    setPage(state, action) {
      state.paging.nextPage = action.payload.nextPage;
      state.paging.limit = action.payload.limit;
    },
    deleteItem(state, action) {
      const { itemId } = action.payload;
      state.items = state.items.filter((item) => item.id !== itemId);
    },

    toggleTrashSelection(state, action) {
      const { id } = action.payload;
      const index = state.selections.findIndex((i) => i.id === id);
      if (index >= 0) {
        state.selections = state.selections.filter((i) => i.id !== id);
      } else {
        state.selections = [...state.selections, action.payload];
      }
    },
    removeTrashSelectionItem(state, action) {
      const { id } = action.payload;
      const index = state.selections.findIndex((i) => i.id === id);
      if (index >= 0) {
        state.selections = state.selections.filter((i) => i.id !== id);
      }
    },

    clearTrashSelections(state) {
      state.selections = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStorageTrashFiles.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.storageDisconnected = false;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchStorageTrashFiles.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;

        const isLoadMore = !!action.meta.arg.nextPage;

        if (isLoadMore) {
          state.items = [...state.items, ...action.payload.items];
        } else {
          state.items = action.payload.items;
          state.path = action.payload.path;
        }
      })
      .addCase(fetchStorageTrashFiles.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }
        state.loading = false;
        if (action.payload === "STORAGE_NOT_CONNECTED") {
          state.storageDisconnected = true;
        } else {
          state.error = "FETCH_FAILED";
        }
      })
      .addCase(deleteStorageTrashFile.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteStorageTrashFile.rejected, (state, action) => {
        if (action.payload === "STORAGE_NOT_CONNECTED") {
          state.storageDisconnected = true;
        } else {
          state.error = "DELETE_FAILED";
        }
      });
  },
});

export const {
  setCurrentFolderId,
  setPage,
  deleteItem,
  resetStorageTrashFileState,
  toggleTrashSelection,
  removeTrashSelectionItem,
  clearTrashSelections,
} = storageTrashFilesSlice.actions;

export default storageTrashFilesSlice.reducer;
