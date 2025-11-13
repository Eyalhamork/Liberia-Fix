// lib/store/app-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  // Search filters
  searchFilters: {
    category: string;
    location: string;
    priceRange: string;
    rating: string;
    search: string;
  };
  setSearchFilters: (filters: Partial<AppState["searchFilters"]>) => void;
  resetSearchFilters: () => void;

  // Recently viewed providers
  recentlyViewed: string[];
  addToRecentlyViewed: (providerId: string) => void;

  // Favorite providers
  favorites: string[];
  toggleFavorite: (providerId: string) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const defaultFilters = {
  category: "all",
  location: "all",
  priceRange: "all",
  rating: "all",
  search: "",
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Search filters
      searchFilters: defaultFilters,
      setSearchFilters: (filters) =>
        set((state) => ({
          searchFilters: { ...state.searchFilters, ...filters },
        })),
      resetSearchFilters: () => set({ searchFilters: defaultFilters }),

      // Recently viewed
      recentlyViewed: [],
      addToRecentlyViewed: (providerId) =>
        set((state) => ({
          recentlyViewed: [
            providerId,
            ...state.recentlyViewed.filter((id) => id !== providerId),
          ].slice(0, 10),
        })),

      // Favorites
      favorites: [],
      toggleFavorite: (providerId) =>
        set((state) => ({
          favorites: state.favorites.includes(providerId)
            ? state.favorites.filter((id) => id !== providerId)
            : [...state.favorites, providerId],
        })),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "liberiafix-app-store",
      partialize: (state) => ({
        favorites: state.favorites,
        recentlyViewed: state.recentlyViewed,
      }),
    }
  )
);
