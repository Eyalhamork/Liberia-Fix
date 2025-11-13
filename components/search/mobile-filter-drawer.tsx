import { Button } from "../ui/button";

// components/search/mobile-filter-drawer.tsx
export function MobileFilterDrawer({
  show,
  onClose,
  filters,
  onFilterChange,
}: {
  show: boolean;
  onClose: () => void;
  filters: any;
  onFilterChange: (key: string, value: any) => void;
}) {
  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity lg:hidden ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl transform transition-transform ${
          show ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <span> X className="h-5 w-5" </span>
            </button>
          </div>

          {/* Filter content goes here - same as desktop */}

          <div className="sticky bottom-0 bg-white pt-4 border-t mt-6">
            <Button onClick={onClose} className="w-full">
              Show Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
