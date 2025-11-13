# LiberiaFix - Service Marketplace Platform

LiberiaFix is West Africa's leading service marketplace, connecting customers with trusted local service providers in Liberia.

## Features

- **Customer Features**

  - Browse and search verified service providers
  - Filter by location, category, price, and rating
  - Pay $3 connection fee to contact providers
  - Leave reviews and ratings
  - Mobile-first responsive design

- **Provider Features**

  - Create detailed business profiles
  - Tier-based subscriptions (Free, Pro, Elite)
  - Portfolio showcase
  - Analytics dashboard
  - Direct customer connections

- **Admin Features**
  - User and provider management
  - Analytics and reporting
  - Payment monitoring
  - System administration

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **Payments**: Mobile Money APIs (Orange Money, MTN)
- **Hosting**: Vercel (frontend), Supabase (backend)
- **PWA**: Next.js PWA support for mobile app experience

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/liberiafix.git
cd liberiafix
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:

   - Run the SQL from `DATABASE_SCHEMA.sql` in your Supabase SQL editor
   - This will create all necessary tables and initial data

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The database schema includes:

- User profiles and authentication
- Service providers and categories
- Connection payments and transactions
- Reviews and ratings system
- Subscription management

Run the `DATABASE_SCHEMA.sql` file in your Supabase project to set up all tables and initial data.

## Project Structure

```
liberiafix/
├── app/                    # Next.js 14 app directory
│   ├── (auth)/            # Authentication pages
│   ├── (customer)/        # Customer-facing pages
│   ├── (provider)/        # Provider dashboard
│   ├── admin/             # Admin interface
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── supabase/         # Supabase client setup
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## Key Features Implementation

### Authentication

- Google OAuth integration
- Email/password authentication
- Role-based access control (customer, provider, admin)

### Payment System

- $3 connection fee for customer-provider contacts
- Provider subscription tiers (Free, Pro $15/month, Elite $35/month)
- Mobile Money integration (Orange Money, MTN)

### Search and Discovery

- Advanced filtering by category, location, price, rating
- Tier-based search ranking (Elite > Pro > Free)
- Real-time search with debouncing

### PWA Support

- Offline functionality
- Mobile app-like experience
- Push notifications (planned)

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 1 (Current)

- [x] Basic authentication
- [x] Provider and customer dashboards
- [x] Search and filtering
- [x] Connection payment system

### Phase 2 (Next)

- [ ] Mobile Money API integration
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

### Phase 3 (Future)

- [ ] Regional expansion (Sierra Leone, Guinea)
- [ ] Multi-language support
- [ ] Advanced matching algorithms
- [ ] Video consultations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@liberiafix.com or create an issue in this repository.

## Acknowledgments

- Built for the Liberian community
- Inspired by the need for trusted local services
- Powered by modern web technologies
