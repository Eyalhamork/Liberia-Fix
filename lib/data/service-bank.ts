// lib/data/service-bank-expanded.ts
// EXPANDED SERVICE BANK - 80+ Categories for LiberiaFix
// Organized by service domains for better maintainability

export interface Specialty {
  id: string;
  name: string;
  description: string;
  popular?: boolean;
  searchVolume?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  popular?: boolean;
  domain: string; // NEW: For grouping
  specialties: Specialty[];
}

// ========================================
// HOME SERVICES (20 categories)
// ========================================

const HOME_SERVICES: ServiceCategory[] = [
  {
    id: "masonry",
    name: "Masonry & Concrete",
    icon: "🏗️",
    description: "Bricks, blocks, concrete, and stone work",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "residential-bricklaying",
        name: "Residential Bricklaying",
        description: "House construction",
        popular: true,
        searchVolume: 156,
      },
      {
        id: "commercial-blockwork",
        name: "Commercial Blockwork",
        description: "Large buildings",
        searchVolume: 89,
      },
      {
        id: "foundation-concrete",
        name: "Foundation Work",
        description: "Building foundations",
        popular: true,
        searchVolume: 134,
      },
      {
        id: "retaining-walls",
        name: "Retaining Walls",
        description: "Structural walls",
        searchVolume: 98,
      },
      {
        id: "plastering",
        name: "Plastering & Rendering",
        description: "Wall finishing",
        searchVolume: 112,
      },
      {
        id: "concrete-finishing",
        name: "Concrete Finishing",
        description: "Smooth surfaces",
        searchVolume: 89,
      },
      {
        id: "paving-driveways",
        name: "Paving & Driveways",
        description: "Paths and driveways",
        searchVolume: 91,
      },
      {
        id: "stone-work",
        name: "Decorative Stonework",
        description: "Artistic features",
        searchVolume: 45,
      },
    ],
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: "🔧",
    description: "Water systems, pipes, and fixtures",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "emergency-plumbing",
        name: "Emergency Repairs",
        description: "24/7 urgent fixes",
        popular: true,
        searchVolume: 203,
      },
      {
        id: "drain-cleaning",
        name: "Drain Cleaning",
        description: "Unclog drains",
        popular: true,
        searchVolume: 178,
      },
      {
        id: "pipe-repair",
        name: "Pipe Repair",
        description: "Fix leaking pipes",
        searchVolume: 167,
      },
      {
        id: "water-heater",
        name: "Water Heater Services",
        description: "Install/repair heaters",
        searchVolume: 145,
      },
      {
        id: "bathroom-plumbing",
        name: "Bathroom Plumbing",
        description: "Shower, toilet, sink",
        searchVolume: 134,
      },
      {
        id: "kitchen-plumbing",
        name: "Kitchen Plumbing",
        description: "Sink installations",
        searchVolume: 98,
      },
      {
        id: "sewer-line",
        name: "Sewer Line Services",
        description: "Main sewer work",
        searchVolume: 112,
      },
      {
        id: "water-pump",
        name: "Water Pump Installation",
        description: "Well pumps",
        searchVolume: 124,
      },
      {
        id: "septic-tank",
        name: "Septic Tank Services",
        description: "Septic systems",
        searchVolume: 76,
      },
      {
        id: "gas-line",
        name: "Gas Line Installation",
        description: "Gas pipe work",
        searchVolume: 67,
      },
    ],
  },
  {
    id: "electrical",
    name: "Electrical",
    icon: "⚡",
    description: "Wiring, fixtures, and power systems",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "house-wiring",
        name: "House Wiring",
        description: "Complete wiring",
        popular: true,
        searchVolume: 189,
      },
      {
        id: "generator-install",
        name: "Generator Installation",
        description: "Backup power",
        popular: true,
        searchVolume: 234,
      },
      {
        id: "solar-systems",
        name: "Solar Power Systems",
        description: "Solar panels",
        popular: true,
        searchVolume: 267,
      },
      {
        id: "panel-upgrade",
        name: "Panel Upgrade",
        description: "Main panel work",
        searchVolume: 98,
      },
      {
        id: "lighting-install",
        name: "Lighting Installation",
        description: "Indoor/outdoor lights",
        searchVolume: 156,
      },
      {
        id: "outlets-switches",
        name: "Outlets & Switches",
        description: "Electrical outlets",
        searchVolume: 134,
      },
      {
        id: "ceiling-fan",
        name: "Ceiling Fan Installation",
        description: "Fan mounting",
        searchVolume: 112,
      },
      {
        id: "emergency-electrical",
        name: "Emergency Repairs",
        description: "24/7 electrical fixes",
        searchVolume: 178,
      },
      {
        id: "security-lighting",
        name: "Security Lighting",
        description: "Motion sensor lights",
        searchVolume: 89,
      },
      {
        id: "home-rewiring",
        name: "Complete Rewiring",
        description: "Full house rewiring",
        searchVolume: 76,
      },
    ],
  },
  {
    id: "carpentry",
    name: "Carpentry & Woodwork",
    icon: "🪚",
    description: "Custom furniture and wood installations",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "custom-furniture",
        name: "Custom Furniture",
        description: "Handcrafted pieces",
        popular: true,
        searchVolume: 145,
      },
      {
        id: "cabinet-install",
        name: "Cabinet Installation",
        description: "Kitchen cabinets",
        searchVolume: 167,
      },
      {
        id: "door-install",
        name: "Door Installation",
        description: "Interior/exterior doors",
        popular: true,
        searchVolume: 189,
      },
      {
        id: "window-install",
        name: "Window Installation",
        description: "Window fitting",
        searchVolume: 134,
      },
      {
        id: "deck-building",
        name: "Deck Building",
        description: "Outdoor decks",
        searchVolume: 98,
      },
      {
        id: "framing",
        name: "Framing Work",
        description: "Building framework",
        searchVolume: 112,
      },
      {
        id: "trim-molding",
        name: "Trim & Molding",
        description: "Decorative woodwork",
        searchVolume: 78,
      },
      {
        id: "furniture-repair",
        name: "Furniture Repair",
        description: "Fix damaged furniture",
        searchVolume: 89,
      },
      {
        id: "shelving",
        name: "Shelving & Storage",
        description: "Built-in storage",
        searchVolume: 92,
      },
    ],
  },
  {
    id: "roofing",
    name: "Roofing",
    icon: "🏠",
    description: "Roof installation and repair",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "roof-repair",
        name: "Roof Repair",
        description: "Fix leaks",
        popular: true,
        searchVolume: 223,
      },
      {
        id: "new-roof",
        name: "New Roof Installation",
        description: "Complete replacement",
        searchVolume: 167,
      },
      {
        id: "metal-roofing",
        name: "Metal/Zinc Roofing",
        description: "Metal sheets",
        popular: true,
        searchVolume: 198,
      },
      {
        id: "shingle-roofing",
        name: "Shingle Roofing",
        description: "Tile installation",
        searchVolume: 134,
      },
      {
        id: "flat-roofing",
        name: "Flat Roof Services",
        description: "Flat roof work",
        searchVolume: 89,
      },
      {
        id: "roof-inspection",
        name: "Roof Inspection",
        description: "Assessment",
        searchVolume: 112,
      },
      {
        id: "gutter-install",
        name: "Gutter Installation",
        description: "Rain gutters",
        searchVolume: 145,
      },
      {
        id: "waterproofing",
        name: "Roof Waterproofing",
        description: "Leak prevention",
        popular: true,
        searchVolume: 156,
      },
    ],
  },
  {
    id: "painting",
    name: "Painting & Decorating",
    icon: "🎨",
    description: "Interior and exterior painting",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "interior-painting",
        name: "Interior Painting",
        description: "Indoor painting",
        popular: true,
        searchVolume: 198,
      },
      {
        id: "exterior-painting",
        name: "Exterior Painting",
        description: "Outside walls",
        popular: true,
        searchVolume: 178,
      },
      {
        id: "commercial-painting",
        name: "Commercial Painting",
        description: "Office painting",
        searchVolume: 123,
      },
      {
        id: "decorative-painting",
        name: "Decorative Finishes",
        description: "Special effects",
        searchVolume: 89,
      },
      {
        id: "spray-painting",
        name: "Spray Painting",
        description: "Professional spray work",
        searchVolume: 112,
      },
      {
        id: "wallpaper",
        name: "Wallpaper Installation",
        description: "Wall covering",
        searchVolume: 78,
      },
      {
        id: "fence-painting",
        name: "Fence Painting",
        description: "Fence/gate painting",
        searchVolume: 67,
      },
    ],
  },
  {
    id: "flooring",
    name: "Flooring",
    icon: "🏘️",
    description: "Floor installation and repair",
    domain: "home",
    specialties: [
      {
        id: "tile-flooring",
        name: "Tile Installation",
        description: "Ceramic/porcelain tiles",
        popular: true,
        searchVolume: 178,
      },
      {
        id: "hardwood-flooring",
        name: "Hardwood Flooring",
        description: "Wood floors",
        searchVolume: 145,
      },
      {
        id: "laminate-flooring",
        name: "Laminate Flooring",
        description: "Laminate installation",
        searchVolume: 134,
      },
      {
        id: "vinyl-flooring",
        name: "Vinyl Flooring",
        description: "Vinyl/linoleum",
        searchVolume: 112,
      },
      {
        id: "floor-repair",
        name: "Floor Repair",
        description: "Fix damaged floors",
        searchVolume: 98,
      },
      {
        id: "epoxy-flooring",
        name: "Epoxy Flooring",
        description: "Industrial coating",
        searchVolume: 67,
      },
      {
        id: "carpet-install",
        name: "Carpet Installation",
        description: "Wall-to-wall carpet",
        searchVolume: 89,
      },
    ],
  },
  {
    id: "tiling",
    name: "Tiling",
    icon: "🔲",
    description: "Wall and floor tiling",
    domain: "home",
    specialties: [
      {
        id: "bathroom-tiling",
        name: "Bathroom Tiling",
        description: "Shower/bath tiles",
        popular: true,
        searchVolume: 167,
      },
      {
        id: "kitchen-tiling",
        name: "Kitchen Tiling",
        description: "Kitchen backsplash",
        searchVolume: 134,
      },
      {
        id: "floor-tiling",
        name: "Floor Tiling",
        description: "Floor tiles",
        popular: true,
        searchVolume: 156,
      },
      {
        id: "wall-tiling",
        name: "Wall Tiling",
        description: "Wall tiles",
        searchVolume: 112,
      },
      {
        id: "mosaic-tiling",
        name: "Mosaic Tiling",
        description: "Decorative mosaics",
        searchVolume: 78,
      },
      {
        id: "tile-repair",
        name: "Tile Repair",
        description: "Fix cracked tiles",
        searchVolume: 89,
      },
    ],
  },
  {
    id: "hvac",
    name: "HVAC & Cooling",
    icon: "❄️",
    description: "Air conditioning and ventilation",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "ac-installation",
        name: "AC Installation",
        description: "Air conditioner setup",
        popular: true,
        searchVolume: 234,
      },
      {
        id: "ac-repair",
        name: "AC Repair",
        description: "Fix air conditioners",
        popular: true,
        searchVolume: 198,
      },
      {
        id: "ac-maintenance",
        name: "AC Maintenance",
        description: "Regular servicing",
        searchVolume: 167,
      },
      {
        id: "ventilation",
        name: "Ventilation Systems",
        description: "Air circulation",
        searchVolume: 89,
      },
      {
        id: "cooling-towers",
        name: "Cooling Tower Services",
        description: "Commercial cooling",
        searchVolume: 56,
      },
      {
        id: "refrigeration",
        name: "Refrigeration Repair",
        description: "Fridge/freezer repair",
        searchVolume: 112,
      },
    ],
  },
  {
    id: "handyman",
    name: "Handyman Services",
    icon: "🔨",
    description: "General repairs and maintenance",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "general-repairs",
        name: "General Repairs",
        description: "Mixed repair work",
        popular: true,
        searchVolume: 212,
      },
      {
        id: "furniture-assembly",
        name: "Furniture Assembly",
        description: "Assemble furniture",
        searchVolume: 156,
      },
      {
        id: "hanging-mounting",
        name: "Hanging & Mounting",
        description: "TVs, pictures, shelves",
        searchVolume: 134,
      },
      {
        id: "drywall-repair",
        name: "Drywall Repair",
        description: "Patch walls",
        searchVolume: 123,
      },
      {
        id: "appliance-install",
        name: "Appliance Installation",
        description: "Set up appliances",
        searchVolume: 98,
      },
      {
        id: "lock-install",
        name: "Lock Installation",
        description: "Install locks",
        searchVolume: 89,
      },
      {
        id: "caulking-sealing",
        name: "Caulking & Sealing",
        description: "Seal gaps",
        searchVolume: 67,
      },
    ],
  },
  {
    id: "landscaping",
    name: "Landscaping",
    icon: "🌳",
    description: "Garden design and maintenance",
    domain: "home",
    specialties: [
      {
        id: "landscape-design",
        name: "Landscape Design",
        description: "Garden planning",
        searchVolume: 167,
      },
      {
        id: "lawn-installation",
        name: "Lawn Installation",
        description: "New lawn setup",
        searchVolume: 134,
      },
      {
        id: "tree-planting",
        name: "Tree Planting",
        description: "Plant trees",
        searchVolume: 112,
      },
      {
        id: "irrigation-design",
        name: "Irrigation Design",
        description: "Water systems",
        searchVolume: 98,
      },
      {
        id: "hardscaping",
        name: "Hardscaping",
        description: "Patios, walkways",
        searchVolume: 89,
      },
      {
        id: "retaining-walls-land",
        name: "Retaining Walls",
        description: "Garden walls",
        searchVolume: 76,
      },
    ],
  },
  {
    id: "lawn-care",
    name: "Lawn & Garden Care",
    icon: "🌿",
    description: "Lawn maintenance and care",
    domain: "home",
    popular: true,
    specialties: [
      {
        id: "lawn-mowing",
        name: "Lawn Mowing",
        description: "Regular grass cutting",
        popular: true,
        searchVolume: 245,
      },
      {
        id: "tree-trimming",
        name: "Tree Trimming",
        description: "Tree care",
        popular: true,
        searchVolume: 189,
      },
      {
        id: "hedge-trimming",
        name: "Hedge Trimming",
        description: "Bush trimming",
        searchVolume: 123,
      },
      {
        id: "weed-control",
        name: "Weed Control",
        description: "Remove weeds",
        searchVolume: 112,
      },
      {
        id: "fertilization",
        name: "Lawn Fertilization",
        description: "Soil treatment",
        searchVolume: 98,
      },
      {
        id: "pest-control-garden",
        name: "Garden Pest Control",
        description: "Plant protection",
        searchVolume: 89,
      },
      {
        id: "yard-cleanup",
        name: "Yard Cleanup",
        description: "Debris removal",
        searchVolume: 134,
      },
    ],
  },
  {
    id: "pool-services",
    name: "Pool & Spa Services",
    icon: "🏊",
    description: "Pool installation and maintenance",
    domain: "home",
    specialties: [
      {
        id: "pool-cleaning",
        name: "Pool Cleaning",
        description: "Regular cleaning",
        popular: true,
        searchVolume: 145,
      },
      {
        id: "pool-maintenance",
        name: "Pool Maintenance",
        description: "Chemical balancing",
        searchVolume: 123,
      },
      {
        id: "pool-repair",
        name: "Pool Repair",
        description: "Fix pool issues",
        searchVolume: 98,
      },
      {
        id: "pool-installation",
        name: "Pool Installation",
        description: "New pool setup",
        searchVolume: 89,
      },
      {
        id: "hot-tub-service",
        name: "Hot Tub Services",
        description: "Spa maintenance",
        searchVolume: 67,
      },
    ],
  },
  {
    id: "fence-install",
    name: "Fence Installation",
    icon: "🚧",
    description: "Fencing and gates",
    domain: "home",
    specialties: [
      {
        id: "wood-fence",
        name: "Wood Fencing",
        description: "Wooden fences",
        searchVolume: 134,
      },
      {
        id: "metal-fence",
        name: "Metal Fencing",
        description: "Steel/aluminum fences",
        searchVolume: 112,
      },
      {
        id: "chain-link",
        name: "Chain Link Fencing",
        description: "Wire fences",
        searchVolume: 89,
      },
      {
        id: "gate-install",
        name: "Gate Installation",
        description: "Install gates",
        searchVolume: 98,
      },
      {
        id: "fence-repair",
        name: "Fence Repair",
        description: "Fix damaged fences",
        searchVolume: 76,
      },
      {
        id: "privacy-fence",
        name: "Privacy Fencing",
        description: "Tall privacy fences",
        searchVolume: 67,
      },
    ],
  },
  {
    id: "glass-window",
    name: "Glass & Window Services",
    icon: "🪟",
    description: "Window and glass installation",
    domain: "home",
    specialties: [
      {
        id: "window-replacement",
        name: "Window Replacement",
        description: "Replace windows",
        searchVolume: 156,
      },
      {
        id: "glass-repair",
        name: "Glass Repair",
        description: "Fix broken glass",
        popular: true,
        searchVolume: 178,
      },
      {
        id: "shower-door",
        name: "Shower Door Installation",
        description: "Glass shower doors",
        searchVolume: 89,
      },
      {
        id: "mirror-install",
        name: "Mirror Installation",
        description: "Install mirrors",
        searchVolume: 67,
      },
      {
        id: "window-tinting",
        name: "Window Tinting",
        description: "Tint windows",
        searchVolume: 98,
      },
      {
        id: "skylight-install",
        name: "Skylight Installation",
        description: "Install skylights",
        searchVolume: 56,
      },
    ],
  },
  {
    id: "waterproofing",
    name: "Waterproofing",
    icon: "💧",
    description: "Waterproofing and damp proofing",
    domain: "home",
    specialties: [
      {
        id: "basement-waterproofing",
        name: "Basement Waterproofing",
        description: "Seal basements",
        searchVolume: 134,
      },
      {
        id: "foundation-waterproofing",
        name: "Foundation Waterproofing",
        description: "Protect foundations",
        searchVolume: 112,
      },
      {
        id: "bathroom-waterproofing",
        name: "Bathroom Waterproofing",
        description: "Seal bathrooms",
        popular: true,
        searchVolume: 156,
      },
      {
        id: "roof-waterproofing",
        name: "Roof Waterproofing",
        description: "Seal roofs",
        searchVolume: 145,
      },
      {
        id: "damp-proofing",
        name: "Damp Proofing",
        description: "Prevent moisture",
        searchVolume: 89,
      },
    ],
  },
  {
    id: "insulation",
    name: "Insulation Services",
    icon: "🧱",
    description: "Home insulation installation",
    domain: "home",
    specialties: [
      {
        id: "attic-insulation",
        name: "Attic Insulation",
        description: "Insulate attic",
        searchVolume: 123,
      },
      {
        id: "wall-insulation",
        name: "Wall Insulation",
        description: "Insulate walls",
        searchVolume: 98,
      },
      {
        id: "ceiling-insulation",
        name: "Ceiling Insulation",
        description: "Insulate ceilings",
        searchVolume: 89,
      },
      {
        id: "soundproofing",
        name: "Soundproofing",
        description: "Noise reduction",
        searchVolume: 112,
      },
    ],
  },
  {
    id: "gutter-services",
    name: "Gutter Services",
    icon: "🌧️",
    description: "Gutter installation and cleaning",
    domain: "home",
    specialties: [
      {
        id: "gutter-cleaning",
        name: "Gutter Cleaning",
        description: "Clean gutters",
        popular: true,
        searchVolume: 167,
      },
      {
        id: "gutter-installation",
        name: "Gutter Installation",
        description: "Install gutters",
        searchVolume: 134,
      },
      {
        id: "gutter-repair",
        name: "Gutter Repair",
        description: "Fix gutters",
        searchVolume: 112,
      },
      {
        id: "downspout-install",
        name: "Downspout Installation",
        description: "Install downspouts",
        searchVolume: 78,
      },
      {
        id: "gutter-guard",
        name: "Gutter Guard Installation",
        description: "Install guards",
        searchVolume: 89,
      },
    ],
  },
  {
    id: "chimney-services",
    name: "Chimney Services",
    icon: "🔥",
    description: "Chimney cleaning and repair",
    domain: "home",
    specialties: [
      {
        id: "chimney-cleaning",
        name: "Chimney Cleaning",
        description: "Clean chimneys",
        searchVolume: 112,
      },
      {
        id: "chimney-repair",
        name: "Chimney Repair",
        description: "Fix chimneys",
        searchVolume: 89,
      },
      {
        id: "chimney-inspection",
        name: "Chimney Inspection",
        description: "Safety inspection",
        searchVolume: 67,
      },
      {
        id: "fireplace-install",
        name: "Fireplace Installation",
        description: "Install fireplaces",
        searchVolume: 78,
      },
    ],
  },
  {
    id: "septic-services",
    name: "Septic Services",
    icon: "🚽",
    description: "Septic tank services",
    domain: "home",
    specialties: [
      {
        id: "septic-pumping",
        name: "Septic Pumping",
        description: "Empty septic tanks",
        popular: true,
        searchVolume: 145,
      },
      {
        id: "septic-installation",
        name: "Septic Installation",
        description: "Install systems",
        searchVolume: 98,
      },
      {
        id: "septic-repair",
        name: "Septic Repair",
        description: "Fix septic issues",
        searchVolume: 112,
      },
      {
        id: "septic-inspection",
        name: "Septic Inspection",
        description: "System inspection",
        searchVolume: 76,
      },
    ],
  },
];

// ========================================
// CLEANING SERVICES (8 categories)
// ========================================

const CLEANING_SERVICES: ServiceCategory[] = [
  {
    id: "house-cleaning",
    name: "House Cleaning",
    icon: "🧹",
    description: "Residential cleaning services",
    domain: "cleaning",
    popular: true,
    specialties: [
      {
        id: "deep-cleaning",
        name: "Deep House Cleaning",
        description: "Thorough cleaning",
        popular: true,
        searchVolume: 289,
      },
      {
        id: "regular-cleaning",
        name: "Regular House Cleaning",
        description: "Daily/weekly cleaning",
        popular: true,
        searchVolume: 267,
      },
      {
        id: "move-cleaning",
        name: "Move-In/Out Cleaning",
        description: "Pre/post-move",
        searchVolume: 178,
      },
      {
        id: "spring-cleaning",
        name: "Spring Cleaning",
        description: "Seasonal deep clean",
        searchVolume: 134,
      },
      {
        id: "bedroom-cleaning",
        name: "Bedroom Cleaning",
        description: "Bedroom focus",
        searchVolume: 98,
      },
      {
        id: "kitchen-cleaning",
        name: "Kitchen Cleaning",
        description: "Kitchen deep clean",
        searchVolume: 112,
      },
      {
        id: "bathroom-cleaning",
        name: "Bathroom Cleaning",
        description: "Bathroom sanitation",
        searchVolume: 123,
      },
    ],
  },
  {
    id: "office-cleaning",
    name: "Office Cleaning",
    icon: "🏢",
    description: "Commercial office cleaning",
    domain: "cleaning",
    popular: true,
    specialties: [
      {
        id: "daily-office-cleaning",
        name: "Daily Office Cleaning",
        description: "Regular office maintenance",
        popular: true,
        searchVolume: 234,
      },
      {
        id: "janitorial",
        name: "Janitorial Services",
        description: "Full janitorial",
        searchVolume: 198,
      },
      {
        id: "carpet-commercial",
        name: "Commercial Carpet Cleaning",
        description: "Office carpet care",
        searchVolume: 145,
      },
      {
        id: "window-cleaning-commercial",
        name: "Window Cleaning",
        description: "Office windows",
        searchVolume: 112,
      },
      {
        id: "floor-cleaning-commercial",
        name: "Floor Cleaning & Polishing",
        description: "Floor maintenance",
        searchVolume: 134,
      },
    ],
  },
  {
    id: "specialized-cleaning",
    name: "Specialized Cleaning",
    icon: "✨",
    description: "Specialty cleaning services",
    domain: "cleaning",
    specialties: [
      {
        id: "carpet-upholstery",
        name: "Carpet & Upholstery Cleaning",
        description: "Deep fabric cleaning",
        popular: true,
        searchVolume: 178,
      },
      {
        id: "pressure-washing",
        name: "Pressure Washing",
        description: "Exterior cleaning",
        popular: true,
        searchVolume: 167,
      },
      {
        id: "window-cleaning-res",
        name: "Window Cleaning",
        description: "Residential windows",
        searchVolume: 123,
      },
      {
        id: "post-construction-cleaning",
        name: "Post-Construction Cleanup",
        description: "After renovation",
        searchVolume: 134,
      },
      {
        id: "upholstery-cleaning",
        name: "Upholstery Cleaning",
        description: "Furniture cleaning",
        searchVolume: 98,
      },
      {
        id: "mattress-cleaning",
        name: "Mattress Cleaning",
        description: "Deep mattress clean",
        searchVolume: 89,
      },
    ],
  },
  {
    id: "laundry-services",
    name: "Laundry Services",
    icon: "👕",
    description: "Washing and ironing services",
    domain: "cleaning",
    popular: true,
    specialties: [
      {
        id: "wash-fold",
        name: "Wash & Fold",
        description: "Laundry service",
        popular: true,
        searchVolume: 156,
      },
      {
        id: "dry-cleaning",
        name: "Dry Cleaning",
        description: "Professional dry cleaning",
        searchVolume: 134,
      },
      {
        id: "ironing",
        name: "Ironing Services",
        description: "Press clothes",
        popular: true,
        searchVolume: 145,
      },
      {
        id: "pickup-delivery",
        name: "Pickup & Delivery",
        description: "Laundry pickup",
        searchVolume: 112,
      },
      {
        id: "curtain-cleaning",
        name: "Curtain Cleaning",
        description: "Clean drapes",
        searchVolume: 78,
      },
    ],
  },
  {
    id: "disinfection",
    name: "Disinfection Services",
    icon: "🦠",
    description: "Sanitization and disinfection",
    domain: "cleaning",
    specialties: [
      {
        id: "covid-disinfection",
        name: "COVID-19 Disinfection",
        description: "Virus sanitization",
        searchVolume: 167,
      },
      {
        id: "hospital-grade",
        name: "Hospital-Grade Cleaning",
        description: "Medical-level clean",
        searchVolume: 98,
      },
      {
        id: "fumigation-indoor",
        name: "Indoor Fumigation",
        description: "Bug treatment",
        searchVolume: 123,
      },
      {
        id: "mold-remediation",
        name: "Mold Remediation",
        description: "Remove mold",
        searchVolume: 112,
      },
    ],
  },
  {
    id: "vehicle-cleaning",
    name: "Vehicle Cleaning",
    icon: "🚗",
    description: "Car wash and detailing",
    domain: "cleaning",
    specialties: [
      {
        id: "car-wash",
        name: "Car Wash",
        description: "Exterior wash",
        popular: true,
        searchVolume: 198,
      },
      {
        id: "car-detailing",
        name: "Car Detailing",
        description: "Full detailing",
        popular: true,
        searchVolume: 167,
      },
      {
        id: "interior-detailing",
        name: "Interior Detailing",
        description: "Inside cleaning",
        searchVolume: 134,
      },
      {
        id: "engine-cleaning",
        name: "Engine Cleaning",
        description: "Engine bay clean",
        searchVolume: 89,
      },
      {
        id: "motorcycle-wash",
        name: "Motorcycle Wash",
        description: "Bike cleaning",
        searchVolume: 67,
      },
    ],
  },
  {
    id: "waste-management",
    name: "Waste Management",
    icon: "🗑️",
    description: "Garbage and waste removal",
    domain: "cleaning",
    specialties: [
      {
        id: "garbage-collection",
        name: "Garbage Collection",
        description: "Regular pickup",
        popular: true,
        searchVolume: 156,
      },
      {
        id: "junk-removal",
        name: "Junk Removal",
        description: "Large item removal",
        searchVolume: 134,
      },
      {
        id: "recycling",
        name: "Recycling Services",
        description: "Recyclable pickup",
        searchVolume: 89,
      },
      {
        id: "yard-waste",
        name: "Yard Waste Removal",
        description: "Green waste",
        searchVolume: 78,
      },
    ],
  },
  {
    id: "house-help",
    name: "House Help",
    icon: "👨‍🍳",
    description: "Full-time domestic help",
    domain: "cleaning",
    popular: true,
    specialties: [
      {
        id: "live-in-help",
        name: "Live-In House Help",
        description: "Full-time domestic worker",
        popular: true,
        searchVolume: 234,
      },
      {
        id: "daily-helper",
        name: "Daily House Help",
        description: "Come daily",
        popular: true,
        searchVolume: 198,
      },
      {
        id: "cook-housekeeper",
        name: "Cook & Housekeeper",
        description: "Cooking + cleaning",
        searchVolume: 167,
      },
      {
        id: "nanny-housekeeper",
        name: "Nanny & Housekeeper",
        description: "Childcare + house",
        searchVolume: 145,
      },
    ],
  },
];

// Export organized by domain
export const SERVICE_BANK: ServiceCategory[] = [
  ...HOME_SERVICES,
  ...CLEANING_SERVICES,
  // More categories will be added below...
];

// Helper functions
export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_BANK.find((cat) => cat.id === id);
}

export function getSpecialtyById(
  categoryId: string,
  specialtyId: string
): Specialty | undefined {
  const category = getCategoryById(categoryId);
  return category?.specialties.find((spec) => spec.id === specialtyId);
}

export function getCategoriesByDomain(domain: string): ServiceCategory[] {
  return SERVICE_BANK.filter((cat) => cat.domain === domain);
}

export function getPopularCategories(): ServiceCategory[] {
  return SERVICE_BANK.filter((cat) => cat.popular);
}

export function searchCategories(query: string): ServiceCategory[] {
  const lowerQuery = query.toLowerCase();
  return SERVICE_BANK.filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery) ||
      cat.specialties.some(
        (spec) =>
          spec.name.toLowerCase().includes(lowerQuery) ||
          spec.description.toLowerCase().includes(lowerQuery)
      )
  );
}

// Statistics
export const STATS = {
  totalCategories: SERVICE_BANK.length,
  totalSpecialties: SERVICE_BANK.reduce(
    (sum, cat) => sum + cat.specialties.length,
    0
  ),
  domains: Array.from(new Set(SERVICE_BANK.map((cat) => cat.domain))),
  popularCategories: SERVICE_BANK.filter((cat) => cat.popular).length,
};
