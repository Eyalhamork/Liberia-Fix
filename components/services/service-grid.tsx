// components/services/service-grid.tsx
interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface ServiceGridProps {
  categories: ServiceCategory[];
  onCategorySelect: (categoryName: string) => void;
}

export function ServiceGrid({
  categories,
  onCategorySelect,
}: ServiceGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.name)}
          className="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-4xl mb-2">{category.icon}</div>
          <h3 className="font-semibold text-gray-800">{category.name}</h3>
          <p className="text-sm text-gray-600">{category.count} providers</p>
        </button>
      ))}
    </div>
  );
}
