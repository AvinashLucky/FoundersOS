import { createSlice } from "@reduxjs/toolkit";

/**
 * Command palette — UI state only (open/closed). ⌘K is truly global UI state,
 * which is exactly what Redux is for in FounderOS (server data stays in Query).
 */
interface PaletteState {
  open: boolean;
}

const initialState: PaletteState = { open: false };

const paletteSlice = createSlice({
  name: "palette",
  initialState,
  reducers: {
    openPalette(state) {
      state.open = true;
    },
    closePalette(state) {
      state.open = false;
    },
    togglePalette(state) {
      state.open = !state.open;
    },
  },
});

export const { openPalette, closePalette, togglePalette } = paletteSlice.actions;
export const paletteReducer = paletteSlice.reducer;
