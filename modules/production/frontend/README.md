# Production & Operations Management Frontend

A comprehensive Next.js 14 frontend application for managing production operations, including products, work orders, inventory, production lines, and bills of materials.

## Features

### Dashboard
- Real-time statistics overview
- Quick action cards for common operations
- Stats from Products, Work Orders, Inventory, and Production Lines

### Products Management
- Complete CRUD operations for products
- Search and category filtering
- Detailed product specifications with JSON support
- Cost and pricing management
- Reorder points and lead times

### Work Orders
- Create and manage production work orders
- Status tracking (Pending, In Progress, Completed, Cancelled)
- Priority management (Low, Medium, High, Urgent)
- Link to products, BOMs, and production lines
- Scheduled and actual time tracking

### Inventory Management
- Track inventory across multiple locations
- Real-time stock levels (On Hand, Allocated, Available)
- Low stock alerts based on reorder points
- Min/max stock level management
- Location-based filtering

### Production Lines
- Manage production line resources
- Status monitoring (Active, Inactive, Maintenance)
- Capacity tracking
- Work order assignment
- Location management

### Bill of Materials (BOM)
- Create complex BOMs with multiple materials
- Version control
- Optional/required material designation
- Effective date tracking
- Material quantity and unit specifications

## Design System

- **Minimal black text** with **blue accents only** (no other colors except grays)
- Blue used exclusively for: icons, action buttons, links, and active states
- Clean, professional layout with proper spacing
- Fully responsive design
- Tailwind CSS utility-first styling

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API Communication**: Fetch API with custom error handling

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Root layout with navigation
│   ├── globals.css                 # Global styles
│   ├── products/
│   │   ├── page.tsx               # Products list
│   │   ├── new/page.tsx           # Create product
│   │   └── [id]/page.tsx          # Product details
│   ├── work-orders/
│   │   ├── page.tsx               # Work orders list
│   │   ├── new/page.tsx           # Create work order
│   │   └── [id]/page.tsx          # Work order details
│   ├── inventory/
│   │   ├── page.tsx               # Inventory list
│   │   ├── new/page.tsx           # Add inventory
│   │   └── [id]/page.tsx          # Inventory details
│   ├── production-lines/
│   │   ├── page.tsx               # Production lines list
│   │   ├── new/page.tsx           # Create line
│   │   └── [id]/page.tsx          # Line details
│   └── bom/
│       ├── page.tsx               # BOMs list
│       ├── new/page.tsx           # Create BOM
│       └── [id]/page.tsx          # BOM details
├── components/
│   ├── Navigation.tsx             # Sidebar navigation
│   ├── LoadingSpinner.tsx         # Loading component
│   └── StatCard.tsx               # Dashboard stat card
└── lib/
    ├── api.ts                     # API utility functions
    └── types.ts                   # TypeScript interfaces

```

## API Configuration

The frontend proxies all API requests to the backend using Next.js rewrites:

```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/production/:path*',
      destination: process.env.PRODUCTION_BACKEND_URL
        ? `${process.env.PRODUCTION_BACKEND_URL}/api/v1/:path*`
        : 'http://production-backend:8000/api/v1/:path*',
    },
  ]
}
```

## Environment Variables

Create a `.env.local` file:

```env
PRODUCTION_BACKEND_URL=http://localhost:8000
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker

### Development

```bash
# Build development image
docker build -f Dockerfile.dev -t production-frontend:dev .

# Run container
docker run -p 3007:3007 -e PRODUCTION_BACKEND_URL=http://backend:8000 production-frontend:dev
```

## API Endpoints Used

### Products
- `GET /api/production/products` - List products
- `GET /api/production/products/:id` - Get product details
- `POST /api/production/products` - Create product
- `PUT /api/production/products/:id` - Update product
- `DELETE /api/production/products/:id` - Delete product
- `GET /api/production/products/stats/overview` - Product statistics

### Work Orders
- `GET /api/production/work-orders` - List work orders
- `GET /api/production/work-orders/:id` - Get work order details
- `POST /api/production/work-orders` - Create work order
- `PATCH /api/production/work-orders/:id/status` - Update status
- `GET /api/production/work-orders/stats/overview` - Work order statistics

### Inventory
- `GET /api/production/inventory` - List inventory
- `GET /api/production/inventory/:id` - Get inventory details
- `POST /api/production/inventory` - Create inventory record
- `PUT /api/production/inventory/:id` - Update inventory
- `GET /api/production/inventory/stats/overview` - Inventory statistics

### Production Lines
- `GET /api/production/production-lines` - List production lines
- `GET /api/production/production-lines/:id` - Get line details
- `POST /api/production/production-lines` - Create production line
- `PUT /api/production/production-lines/:id` - Update production line
- `DELETE /api/production/production-lines/:id` - Delete production line
- `GET /api/production/production-lines/stats/overview` - Line statistics

### Bill of Materials
- `GET /api/production/bom` - List BOMs
- `GET /api/production/bom/:id` - Get BOM details
- `POST /api/production/bom` - Create BOM
- `DELETE /api/production/bom/:id` - Delete BOM

## Key Features

### Error Handling
- Custom `ApiError` class for API errors
- User-friendly error messages
- Form validation with error display

### Loading States
- Loading spinners for all data fetching operations
- Disabled buttons during form submission
- Smooth transitions

### Responsive Design
- Mobile-first approach
- Grid layouts that adapt to screen size
- Touch-friendly interface

### Navigation
- Fixed sidebar with active state highlighting
- Breadcrumb-style back navigation
- Quick action cards on dashboard

### Data Management
- Real-time data updates
- Optimistic UI updates
- Proper data refetching after mutations

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private - All rights reserved

## Development Notes

- Port: 3007
- All API calls use the `/api/production` prefix
- TypeScript strict mode enabled
- ESLint configured for Next.js
- Tailwind CSS with JIT mode
