// components/search/popular-searches.tsx
export function PopularSearches({
  onSearchClick,
}: {
  onSearchClick: (term: string) => void;
}) {
  const popularSearches = [
    { term: "plumber", icon: "🔧", color: "blue" },
    { term: "electrician", icon: "⚡", color: "yellow" },
    { term: "roof repair", icon: "🏠", color: "red" },
    { term: "house cleaning", icon: "🧹", color: "green" },
    { term: "driver", icon: "🚗", color: "purple" },
    { term: "generator", icon: "⚡", color: "orange" },
    { term: "security", icon: "🛡️", color: "indigo" },
    { term: "painter", icon: "🎨", color: "pink" },
  ];

  return (
    <div className="mb-6">
      <p className="text-sm text-gray-600 mb-3 font-medium">
        Popular Searches:
      </p>
      <div className="flex flex-wrap gap-2">
        {popularSearches.map((search) => (
          <button
            key={search.term}
            onClick={() => onSearchClick(search.term)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:shadow-md transition-shadow flex items-center gap-2 text-sm font-medium"
          >
            <span>{search.icon}</span>
            <span className="capitalize">{search.term}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
