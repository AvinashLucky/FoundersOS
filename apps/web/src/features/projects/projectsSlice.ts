import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Projects — UI STATE ONLY (Redux Toolkit).
 *
 * ── The golden rule of state in FounderOS ──────────────────────────────
 *  • SERVER data (the list of projects from the DB) → React Query (see hooks.ts).
 *  • EPHEMERAL UI state (what's selected, is a dialog open) → Redux, here.
 *  We do NOT put the project list in Redux — that would duplicate the server
 *  and force us to keep two copies in sync. Redux only holds "view" state.
 * ───────────────────────────────────────────────────────────────────────
 */
interface ProjectsUiState {
  /** The project the founder is currently focused on (drives the theme). */
  activeProjectId: string | null;
  /** Whether the "Create project" dialog is showing. */
  createDialogOpen: boolean;
}

const initialState: ProjectsUiState = {
  activeProjectId: null,
  createDialogOpen: false,
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    // PayloadAction<string> = this action carries a string (the project id).
    setActiveProject(state, action: PayloadAction<string>) {
      state.activeProjectId = action.payload; // Immer lets us "mutate" safely.
    },
    clearActiveProject(state) {
      state.activeProjectId = null;
    },
    openCreateDialog(state) {
      state.createDialogOpen = true;
    },
    closeCreateDialog(state) {
      state.createDialogOpen = false;
    },
  },
});

export const { setActiveProject, clearActiveProject, openCreateDialog, closeCreateDialog } =
  projectsSlice.actions;

export const projectsReducer = projectsSlice.reducer;
