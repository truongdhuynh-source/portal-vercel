import { GET_SCREEN_SIZE } from "@/constants";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  screen: GET_SCREEN_SIZE(),
  isAdminMode: false,
};

const AppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },

    setScreen(state, action) {
      state.screen = action.payload;
    },

    setIsAdminMode(state, action) {
      state.isAdminMode = action.payload;
    },
  },
});

export const { setLoading, setScreen, setIsAdminMode } = AppSlice.actions;
export default AppSlice.reducer;
