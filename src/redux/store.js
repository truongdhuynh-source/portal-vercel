import { configureStore, combineReducers } from "@reduxjs/toolkit";
import appReducer from "./features/app/appSlice.js";
import sidebarReducer from "./features/sidebar/sidebarSlice.js";
import storageCloudReducer from "./features/storageCloud/storageCloud.slice.js";
import storageFilesReducer from "./features/storageCloud/storageFiles.slice.js";
import storageUploadReducer from "./features/storageCloud/storageUpload.slice.js";
import storageCreateFileReducer from "./features/storageCloud/storageCreateFile.slice.js";
import storageTrashFilesReducer from "./features/storageCloud/storageTrashFiles.slice.js";
const storageReducer = combineReducers({
  storageCloud: storageCloudReducer,
  storageFiles: storageFilesReducer,
  storageUpload: storageUploadReducer,
  storageCreateFile: storageCreateFileReducer,
  storageTrashFiles: storageTrashFilesReducer,
});

export const store = configureStore({
  reducer: {
    app: appReducer,
    sideBar: sidebarReducer,
    storage: storageReducer,
  },
});
