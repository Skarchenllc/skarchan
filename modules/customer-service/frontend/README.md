# Customer Service Frontend

Complete Next.js frontend for the Customer Service module, following the R&D module pattern.

## Module Details

- **Module Name**: Customer Service
- **Module Code**: `customer_service`
- **Port**: 3013
- **Base Path**: `/customer-service`
- **Backend URL**: `http://customer-service-backend:8000`

## Entities (5 Total)

1. **Support Tickets** - Track and manage customer support tickets
2. **Knowledge Base** - Maintain knowledge articles and documentation
3. **Service Requests** - Handle customer service requests
4. **Customer Feedback** - Collect and analyze customer feedback
5. **SLA Agreements** - Manage service level agreements

## Project Structure

```
customer-service/frontend/
├── package.json                 # Dependencies and scripts
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── .env.local                  # Environment variables
├── .gitignore                  # Git ignore rules
│
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with Navigation
│   │   ├── page.tsx            # Dashboard with 5 entity overview cards
│   │   ├── globals.css         # Global styles
│   │   │
│   │   ├── support-tickets/
│   │   │   ├── page.tsx        # List view
│   │   │   ├── new/page.tsx    # Create form
│   │   │   └── [id]/page.tsx   # Edit form
│   │   │
│   │   ├── knowledge-base/
│   │   │   ├── page.tsx        # List view
│   │   │   ├── new/page.tsx    # Create form
│   │   │   └── [id]/page.tsx   # Edit form
│   │   │
│   │   ├── service-requests/
│   │   │   ├── page.tsx        # List view
│   │   │   ├── new/page.tsx    # Create form
│   │   │   └── [id]/page.tsx   # Edit form
│   │   │
│   │   ├── customer-feedback/
│   │   │   ├── page.tsx        # List view
│   │   │   ├── new/page.tsx    # Create form
│   │   │   └── [id]/page.tsx   # Edit form
│   │   │
│   │   └── sla-agreements/
│   │       ├── page.tsx        # List view
│   │       ├── new/page.tsx    # Create form
│   │       └── [id]/page.tsx   # Edit form
│   │
│   ├── components/
│   │   ├── Navigation.tsx           # Module navigation with dropdown groups
│   │   ├── SharedHeader.tsx         # Shared header component
│   │   ├── LoadingSpinner.tsx       # Loading indicator
│   │   └── DynamicEntityForm.tsx    # Dynamic form builder
│   │
│   └── lib/
│       ├── api.ts              # API client with all entity endpoints
│       └── types.ts            # TypeScript interfaces for all entities
```

## Navigation Structure

The module uses a dropdown-based navigation organized into logical groups:

### Support
- Support Tickets
- Service Requests

### Knowledge
- Knowledge Base
- Customer Feedback

### SLA
- SLA Agreements

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_MODULE=customer_service
CUSTOMER_SERVICE_BACKEND_URL=http://localhost:8013
```

3. Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3013/customer-service`

### Build for Production

```bash
npm run build
npm start
```

## API Integration

The frontend communicates with the Customer Service backend through:

- **Custom Fields API**: `/customer-service/custom-fields/definitions`
- **Support Tickets API**: `/customer-service/support-tickets`
- **Knowledge Base API**: `/customer-service/knowledge-base`
- **Service Requests API**: `/customer-service/service-requests`
- **Customer Feedback API**: `/customer-service/customer-feedback`
- **SLA Agreements API**: `/customer-service/sla-agreements`

All entities support:
- List (with filtering)
- Get by ID
- Create
- Update
- Delete

## Dynamic Forms

Forms are dynamically generated based on field definitions from the backend. This allows administrators to customize fields without changing frontend code.

## Features

- Dynamic entity forms with field definitions from backend
- Search and filter capabilities on all list pages
- Responsive design with Tailwind CSS
- TypeScript for type safety
- Shared header with theme support
- Integration with Control Room for authentication

## Technologies

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks
- **API Client**: Native Fetch API

## File Count Summary

**Total Files Created**: 28

### Configuration Files (8)
- package.json
- next.config.js
- tsconfig.json
- tailwind.config.ts
- postcss.config.js
- .env.local
- .gitignore
- README.md

### Library Files (2)
- src/lib/api.ts
- src/lib/types.ts

### Component Files (4)
- src/components/Navigation.tsx
- src/components/SharedHeader.tsx
- src/components/LoadingSpinner.tsx
- src/components/DynamicEntityForm.tsx

### App Files (14)
- src/app/layout.tsx
- src/app/page.tsx
- src/app/globals.css
- src/app/support-tickets/page.tsx
- src/app/support-tickets/new/page.tsx
- src/app/support-tickets/[id]/page.tsx
- src/app/knowledge-base/page.tsx
- src/app/knowledge-base/new/page.tsx
- src/app/knowledge-base/[id]/page.tsx
- src/app/service-requests/page.tsx
- src/app/service-requests/new/page.tsx
- src/app/service-requests/[id]/page.tsx
- src/app/customer-feedback/page.tsx
- src/app/customer-feedback/new/page.tsx
- src/app/customer-feedback/[id]/page.tsx
- src/app/sla-agreements/page.tsx
- src/app/sla-agreements/new/page.tsx
- src/app/sla-agreements/[id]/page.tsx

## License

Proprietary - Business Management Platform
