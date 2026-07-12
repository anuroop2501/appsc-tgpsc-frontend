import { create } from 'zustand'

const useBreadcrumbStore = create((set) => ({
  override: null,
  setOverride: (crumbs) => set({ override: crumbs }),
  clearOverride: () => set({ override: null }),
}))

export default useBreadcrumbStore
