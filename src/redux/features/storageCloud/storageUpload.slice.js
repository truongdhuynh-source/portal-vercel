import axiosInstance from "@/plugins/axios";
import { addItem, fetchStorageFiles } from "@/redux/features/storageCloud/storageFiles.slice";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
const uploadFileApi = (provider, connectionId, file, folderId, context, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  if (folderId) formData.append("folderId", folderId);

  return axiosInstance.post(
    `/storage/${provider}/${connectionId}/file/upload`,
    formData,
    {
      params: context,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (!e.total) return;
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress?.(percent);
      },
    },
  );
};

export const uploadFiles = createAsyncThunk(
  "storage/uploadFiles",
  async (
    { provider, connectionId, files, folderId, context },
    { dispatch },
  ) => {
    await Promise.all(
      files.map((file) =>
        uploadFileApi(provider, connectionId, file, folderId, context, (progress) => {
          dispatch(
            updateProgress({
              uid: file.uid,
              progress,
            }),
          );
        }).then(({ data }) => {
          dispatch(addItem(data));
          dispatch(markDone(file.uid));
        }),
      ),
    );
  },
);

const uploadSlice = createSlice({
  name: "storageUpload",
  initialState: {
    uploading: false,
    progress: {},
    done: {},
  },
  reducers: {
    updateProgress(state, action) {
      state.progress[action.payload.uid] = action.payload.progress;
    },
    markDone(state, action) {
      state.done[action.payload] = true;
    },
    resetUpload(state) {
      state.uploading = false;
      state.progress = {};
      state.done = {};
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(uploadFiles.pending, (state) => {
        state.uploading = true;
      })
      .addCase(uploadFiles.fulfilled, (state) => {
        state.uploading = false;
      })
      .addCase(uploadFiles.rejected, (state) => {
        state.uploading = false;
      });
  },
});

export const { updateProgress, markDone, resetUpload } = uploadSlice.actions;

export default uploadSlice.reducer;
