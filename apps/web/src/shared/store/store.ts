import { configureStore } from "@reduxjs/toolkit";
import { projectsReducer } from "@features/projects/projectsSlice";
import { paletteReducer } from "@features/command-palette/paletteSlice";

/**
 * The single Redux store. Add one line per feature slice here.
 * Keep this store SMALL — only truly-global UI state lives in Redux.
 */
export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    palette: paletteReducer,
    // future: active run, etc.
  },
});

// These two types are inferred from the store and power the typed hooks (hooks.ts).
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
