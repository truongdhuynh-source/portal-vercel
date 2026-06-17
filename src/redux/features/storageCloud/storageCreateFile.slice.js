import axiosInstance from "@/plugins/axios";
import {
  addItem,
  fetchStorageFiles,
} from "@/redux/features/storageCloud/storageFiles.slice";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const createFileApi = {
  createFolder: (provider, connectionId, data) => {
    return axiosInstance.post(
      `/storage/${provider}/${connectionId}/create-folders`,
      data,
      { params: data.context },
    );
  },
};

export const createFolder = createAsyncThunk(
  "storage/createFolder",
  async (
    { provider, connectionId, name, parentId, context },
    { rejectWithValue, getState, dispatch },
  ) => {
    try {
      await createFileApi
        .createFolder(provider, connectionId, {
          name,
          parentId,
          context,
        })
        .then(({ data }) => {
          dispatch(addItem(data));
        });
    } catch (err) {
      return rejectWithValue(err?.data);
    }
  },
);

const initialState = {
  creatingFolder: false,
  error: null,
};

const storageCreateSlice = createSlice({
  name: "storageCreate",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createFolder.pending, (state) => {
        state.creatingFolder = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state) => {
        state.creatingFolder = false;
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.creatingFolder = false;
        state.error = action.payload;
      });
  },
});

export const {} = storageCreateSlice.actions;

export default storageCreateSlice.reducer;
