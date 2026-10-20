import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

/**
 * Typed Redux hooks — always use THESE, never the raw useDispatch/useSelector.
 * They give you autocomplete and type-safety on state and actions.
 *
 *   const dispatch = useAppDispatch();
 *   const open = useAppSelector((s) => s.projects.createDialogOpen);
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
