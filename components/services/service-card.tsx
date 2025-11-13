// components/services/service-card.tsx
import { Card, CardContent } from "@/components/ui/card";

interface ServiceCardProps {
  service: {
    name: string;
    icon: string;
    count: number;
  };
  onClick: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6 text-center">
        <div className="text-4xl mb-2">{service.icon}</div>
        <h3 className="font-semibold text-gray-800">{service.name}</h3>
        <p className="text-sm text-gray-600">{service.count} providers</p>
      </CardContent>
    </Card>
  );
}
