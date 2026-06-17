import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/plugins/axios";

const encodeStoragePathParam = (value) => encodeURIComponent(String(value));

export const fetchStorageFiles = createAsyncThunk(
  "storageFiles/fetch",
  async (
    {
      provider,
      connectionId,
      folderId,
      nextPage,
      limit,
      filter,
      context,
    },
    { rejectWithValue, dispatch },
  ) => {  
    try {
      const isSharePoint = provider?.toUpperCase() === "SHARE_POINT";

      const params = {};

      if (isSharePoint) {
        params.type = context?.type || "root";

        if (context?.siteId) params.siteId = context.siteId;
        if (context?.driveId) params.driveId = context.driveId;
        if (context?.itemId) params.itemId = context.itemId;
      } else {
        if (folderId) params.folderId = folderId;
      }

      if (nextPage) params.nextPage = nextPage;
      if (limit) params.limit = limit;
      if (filter?.sortBy) params.sortBy = filter.sortBy;
      if (filter?.sortDirection) params.direction = filter.sortDirection;
      if (filter?.showByExtension && filter.showByExtension !== "all") {
        params.ext = filter.showByExtension;
      }

      const { data } = await axiosInstance.get(
        `/storage/${provider}/${connectionId}/files`,
        { params },
      );

      dispatch(
        setPage({
          nextPage: data.paging.nextPage,
          limit: data.paging.limit,
        }),
      );

      return {
        items: data.items.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          size: item.size,
          modifiedAt: item.modifiedAt,
          context: item.context,
        })),

        path: data.path.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type || "path",
          context: item.context,
        })),

        paging: {
          nextPage: data.paging.nextPage,
          limit,
        },

        queryKey: JSON.stringify({
          ...(isSharePoint ? context : { folderId }),
          filter,
        }),
      };
    } catch (err) {
      if (err?.data?.message === "STORAGE_NOT_CONNECTED") {
        return rejectWithValue("STORAGE_NOT_CONNECTED");
      }
      return rejectWithValue("FETCH_FAILED");
    }
  },
);

const startFakeProgress = (dispatch, downloadKey) => {
  let fakeProgress = 0;

  const timer = setInterval(
    () => {
      const increment =
        fakeProgress < 50 ? Math.random() * 5 + 2 : Math.random() * 2 + 0.5;

      fakeProgress = Math.min(fakeProgress + Math.floor(increment), 90);

      dispatch(
        setDownloadProgress({
          key: downloadKey,
          progress: fakeProgress,
        }),
      );
    },
    Math.random() * 1000 + 1000,
  );

  return {
    stop: () => clearInterval(timer),
    getProgress: () => fakeProgress,
  };
};

const animateToComplete = async (
  dispatch,
  downloadKey,
  startProgress,
  interval = 50,
) => {
  await new Promise((resolve) => {
    let smoothProgress = startProgress;

    const finishInterval = setInterval(() => {
      const diff = 100 - smoothProgress;
      smoothProgress += diff * 0.15;

      if (diff < 0.5) {
        smoothProgress = 100;
        clearInterval(finishInterval);

        dispatch(
          setDownloadProgress({
            key: downloadKey,
            progress: 100,
          }),
        );

        resolve();
        return;
      }

      dispatch(
        setDownloadProgress({
          key: downloadKey,
          progress: Math.floor(smoothProgress),
        }),
      );
    }, interval);
  });
};

const downloadBlob = (response, fallbackName, type) => {
  let filename = fallbackName;

  const contentDisposition = response.headers["content-disposition"];

  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (match?.[1]) {
      filename = decodeURIComponent(match[1]);
    }
  }

  const blob = new Blob([response.data], {
    type,
  });

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadStorageItemsAsFile = createAsyncThunk(
  "storageFiles/downloadAsFile",
  async ({ provider, connectionId, fileId, context }, { dispatch, rejectWithValue }) => {
    const downloadKey = "file:" + fileId;

    try {
      dispatch(startDownload(downloadKey));

      const fake = startFakeProgress(dispatch, downloadKey);
      const encodedFileId = encodeStoragePathParam(fileId);

      const response = await axiosInstance.get(
        `/storage/${provider}/files/${connectionId}/${encodedFileId}/download`,
        { responseType: "blob", params: context },
      );

      fake.stop();

      await animateToComplete(dispatch, downloadKey, fake.getProgress());

      downloadBlob(response, "download");

      dispatch(finishDownloadWithAutoClear(downloadKey));
    } catch (err) {
      dispatch(failDownload(downloadKey));
      return rejectWithValue("FETCH_FAILED");
    }
  },
);

export const downloadStorageItemsAsZip = createAsyncThunk(
  "storageFiles/downloadAsZip",
  async (
    { provider, connectionId, items, name, context },
    { dispatch, rejectWithValue },
  ) => {
    const downloadKey = "zip:" + items.map((i) => i.id).join(",");

    try {
      dispatch(startDownload(downloadKey));

      const fake = startFakeProgress(dispatch, downloadKey);

      const response = await axiosInstance.post(
        `/storage/${provider}/files/${connectionId}/download-zip`,
        { items, name },
        { responseType: "blob", params: context },
      );

      fake.stop();

      await animateToComplete(dispatch, downloadKey, fake.getProgress());

      downloadBlob(response, name ?? "download.zip", "application/zip");

      dispatch(finishDownloadWithAutoClear(downloadKey));
    } catch (err) {
      dispatch(failDownload(downloadKey));
      return rejectWithValue("DOWNLOAD_ZIP_FAILED");
    }
  },
);

export const deleteStorageFile = createAsyncThunk(
  "storageFiles/delete",
  async (
    { provider, connectionId, itemId, type, context },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const encodedItemId = encodeStoragePathParam(itemId);

      await axiosInstance.delete(
        `/storage/${provider}/${connectionId}/items/${encodedItemId}`,
        {
          params: { type, ...context },
        },
      );

      dispatch(deleteItem({ itemId }));
      dispatch(removeSelectionItem({ id: itemId }));

      return { itemId };
    } catch (err) {
      if (err?.response?.data?.message === "STORAGE_NOT_CONNECTED") {
        return rejectWithValue("STORAGE_NOT_CONNECTED");
      }
      return rejectWithValue("DELETE_FAILED");
    }
  },
);

export const renameStorageItem = createAsyncThunk(
  "storageFiles/rename",
  async (
    { provider, connectionId, itemId, type, name, context },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const encodedItemId = encodeStoragePathParam(itemId);

      await axiosInstance
        .patch(
          `/storage/${provider}/${connectionId}/items/${encodedItemId}/rename`,
          {
            type,
            name,
          },
          { params: context },
        )
        .then(({ data }) => {
          dispatch(updateItem(data));
        });

      return { itemId, name };
    } catch (err) {
      return rejectWithValue("RENAME_FAILED");
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
    limit: 15,
    total: 0,
  },
  filter: {
    sortBy: "date",
    sortDirection: "DESC",
    showByExtension: "all",
  },
  loading: false,
  error: null,
  storageDisconnected: false,
  downloads: {
    /*
      [type:fileId]: {
        progress: number,
        status: 'downloading' | 'done' | 'error'
      }
    */
  },
  queryKey: null,
  selections: [],
  renamingItems: [],
};

const storageFilesSlice = createSlice({
  name: "storageFiles",
  initialState,
  reducers: {
    resetStorageFileState(state, action) {
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

    startDownload(state, action) {
      const key = action.payload;
      state.downloads[key] = {
        progress: 0,
        status: "downloading",
      };
    },

    setDownloadProgress(state, action) {
      const { key, progress } = action.payload;
      if (state.downloads[key]) {
        state.downloads[key].progress = progress;
      }
    },

    finishDownload(state, action) {
      const key = action.payload;
      if (state.downloads[key]) {
        state.downloads[key].progress = 100;
        state.downloads[key].status = "done";
      }
    },

    failDownload(state, action) {
      const key = action.payload;
      if (state.downloads[key]) {
        state.downloads[key].status = "error";
      }
    },

    clearDownload(state, action) {
      const key = action.payload;
      delete state.downloads[key];
    },

    deleteItem(state, action) {
      const { itemId } = action.payload;
      state.items = state.items.filter((item) => item.id !== itemId);
    },

    addItem(state, action) {
      const newItem = action.payload;

      if (newItem.type === "folder") {
        state.items.unshift(newItem);
        return;
      }

      if (newItem.type === "file") {
        const lastFolderIndex = state.items.findLastIndex(
          (item) => item.type === "folder",
        );
        const insertIndex = lastFolderIndex >= 0 ? lastFolderIndex + 1 : 0;
        state.items.splice(insertIndex, 0, newItem);
      }
    },
    updateItem(state, action) {
      const item = action.payload;
      const index = state.items.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        state.items[index] = item;
      }
    },
    updateFilterByExtension(state, action) {
      state.filter.showByExtension = action.payload;
    },
    startRenamingItem(state, action) {
      const itemId = action.payload;
      if (itemId != null && !state.renamingItems.includes(itemId)) {
        state.renamingItems.push(itemId);
      }
    },
    finishRenamingItem(state, action) {
      const itemId = action.payload;
      state.renamingItems = state.renamingItems.filter((id) => id !== itemId);
    },
    toggleSelection(state, action) {
      const { id } = action.payload;
      const index = state.selections.findIndex((i) => i.id === id);
      if (index >= 0) {
        state.selections = state.selections.filter((i) => i.id !== id);
      } else {
        state.selections = [...state.selections, action.payload];
      }
    },
    removeSelectionItem(state, action) {
      const { id } = action.payload;
      const index = state.selections.findIndex((i) => i.id === id);
      if (index >= 0) {
        state.selections = state.selections.filter((i) => i.id !== id);
      }
    },

    selectAllItems(state, action) {
      state.selections = action.payload;
    },

    clearSelections(state) {
      state.selections = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStorageFiles.pending, (state, action) => {
        state.loading = action.meta.arg?.silent ? false : true;
        state.error = null;
        state.storageDisconnected = false;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchStorageFiles.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) {
          return;
        }

        state.loading = false;
   
        const isNewQuery = state.queryKey !== action.payload.queryKey;
        const isLoadMore = !!action.meta.arg.nextPage && !isNewQuery;

        if (isLoadMore) {
          state.items = [...state.items, ...action.payload.items];
        } else {
          state.items = action.payload.items;
          state.path = action.payload.path;
        }
        state.queryKey = action.payload.queryKey;
        const lastPath = action.payload.path[action.payload.path.length - 1];
        state.currentFolderId = lastPath?.id ?? "0";

        if (Array.isArray(action.payload.items) && state.renamingItems.length) {
          const refreshedIds = new Set(action.payload.items.map((it) => it.id));
          state.renamingItems = state.renamingItems.filter((id) => !refreshedIds.has(id));
        }
      })
      .addCase(fetchStorageFiles.rejected, (state, action) => {
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
      .addCase(deleteStorageFile.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteStorageFile.rejected, (state, action) => {
        if (action.payload === "STORAGE_NOT_CONNECTED") {
          state.storageDisconnected = true;
        } else {
          state.error = "DELETE_FAILED";
        }
      })
      .addCase(renameStorageItem.pending, (state, action) => {
        state.error = null;
        const itemId = action.meta.arg?.itemId;
        if (itemId != null && !state.renamingItems.includes(itemId)) {
          state.renamingItems.push(itemId);
        }
      })
      .addCase(renameStorageItem.fulfilled, (state, action) => {
        const itemId = action.payload?.itemId;
        const provider = action.meta.arg?.provider;
        if (itemId != null && !["web_dav", "ocis"].includes(provider)) {
          state.renamingItems = state.renamingItems.filter((id) => id !== itemId);
        }
      })
      .addCase(renameStorageItem.rejected, (state, action) => {
        const itemId = action.meta.arg?.itemId;
        if (itemId != null) {
          state.renamingItems = state.renamingItems.filter((id) => id !== itemId);
        }
        state.error = "RENAME_FAILED";
      });
  },
});

const finishDownloadWithAutoClear = (key) => (dispatch) => {
  dispatch(finishDownload(key));

  setTimeout(() => {
    dispatch(clearDownload(key));
  }, 5000);
};

export const {
  setCurrentFolderId,
  setPage,
  startDownload,
  setDownloadProgress,
  finishDownload,
  failDownload,
  clearDownload,
  resetStorageFileState,
  deleteItem,
  addItem,
  updateItem,
  updateFilterByExtension,
  toggleSelection,
  removeSelectionItem,
  selectAllItems,
  clearSelections,
} = storageFilesSlice.actions;

export default storageFilesSlice.reducer;
