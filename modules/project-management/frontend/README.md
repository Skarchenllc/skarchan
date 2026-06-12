# Project Management Frontend

This is the frontend application for the Project Management module, built with Next.js 14, React 18, and TypeScript.

## Module Information

- **Module Name**: Project Management
- **Module Code**: `project_management`
- **Port**: 3014
- **Base Path**: `/pm`
- **Backend URL**: `http://project-management-backend:8000`

## Components (6 Entities)

1. **PM Projects** - Project tracking and management
2. **PM Tasks** - Task assignment and tracking
3. **PM Milestones** - Project milestone management
4. **PM Resources** - Resource allocation and management
5. **Time Tracking** - Time entry and tracking
6. **PM Budgets** - Budget planning and monitoring

## Project Structure

```
project-management/frontend/
├── .env.local                    # Environment variables
├── .gitignore                    # Git ignore rules
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies and scripts
├── postcss.config.js             # PostCSS configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Dashboard page
│   │   ├── globals.css           # Global styles
│   │   ├── projects/             # Projects pages
│   │   │   ├── page.tsx          # Projects listing
│   │   │   ├── new/page.tsx      # New project form
│   │   │   └── [id]/page.tsx    # Edit project form
│   │   ├── tasks/                # Tasks pages
│   │   │   ├── page.tsx          # Tasks listing
│   │   │   ├── new/page.tsx      # New task form
│   │   │   └── [id]/page.tsx    # Edit task form
│   │   ├── milestones/           # Milestones pages
│   │   │   ├── page.tsx          # Milestones listing
│   │   │   ├── new/page.tsx      # New milestone form
│   │   │   └── [id]/page.tsx    # Edit milestone form
│   │   ├── resources/            # Resources pages
│   │   │   ├── page.tsx          # Resources listing
│   │   │   ├── new/page.tsx      # New resource form
│   │   │   └── [id]/page.tsx    # Edit resource form
│   │   ├── time-tracking/        # Time tracking pages
│   │   │   ├── page.tsx          # Time entries listing
│   │   │   ├── new/page.tsx      # New time entry form
│   │   │   └── [id]/page.tsx    # Edit time entry form
│   │   └── budgets/              # Budgets pages
│   │       ├── page.tsx          # Budgets listing
│   │       ├── new/page.tsx      # New budget form
│   │       └── [id]/page.tsx    # Edit budget form
│   ├── components/               # Reusable components
│   │   ├── Navigation.tsx        # Module navigation
│   │   ├── SharedHeader.tsx      # Shared header component
│   │   ├── LoadingSpinner.tsx    # Loading spinner
│   │   └── DynamicEntityForm.tsx # Dynamic form builder
│   └── lib/                      # Utilities and types
│       ├── api.ts                # API client functions
│       └── types.ts              # TypeScript interfaces
```

## Files Created (34 total)

### Configuration Files (6)
- `.env.local` - Environment configuration
- `.gitignore` - Git ignore patterns
- `next.config.js` - Next.js configuration
- `package.json` - NPM dependencies
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

### Core Files (4)
- `src/app/layout.tsx` - Root layout with navigation
- `src/app/page.tsx` - Dashboard with overview cards
- `src/app/globals.css` - Global CSS styles
- `README.md` - This file

### Library Files (2)
- `src/lib/api.ts` - API endpoints for all 6 entities + customFields
- `src/lib/types.ts` - TypeScript interfaces for all 6 entities

### Components (4)
- `src/components/Navigation.tsx` - Navigation with dropdown groups
- `src/components/SharedHeader.tsx` - Shared header component
- `src/components/LoadingSpinner.tsx` - Loading spinner
- `src/components/DynamicEntityForm.tsx` - Dynamic form builder

### Entity Pages (18)
Each of the 6 entities has 3 pages:
- Listing page (`page.tsx`)
- New form page (`new/page.tsx`)
- Edit form page (`[id]/page.tsx`)

**Entities:**
1. Projects (`/projects`)
2. Tasks (`/tasks`)
3. Milestones (`/milestones`)
4. Resources (`/resources`)
5. Time Tracking (`/time-tracking`)
6. Budgets (`/budgets`)

## Navigation Structure

The navigation is organized into logical dropdown groups:

### Projects Group
- Projects - Project management
- Tasks - Task tracking
- Milestones - Milestone tracking

### Resources Group
- Resources - Resource allocation
- Time Tracking - Time entry logging

### Financial Group
- Budgets - Budget management

## API Endpoints

All API endpoints follow the pattern: `/project-management/{entity}`

### Entities
- `/project-management/projects` - PM Projects
- `/project-management/tasks` - PM Tasks
- `/project-management/milestones` - PM Milestones
- `/project-management/resources` - PM Resources
- `/project-management/time-tracking` - Time Tracking
- `/project-management/budgets` - PM Budgets
- `/project-management/custom-fields/definitions` - Custom Fields

## Key Features

1. **Dynamic Forms** - All forms use DynamicEntityForm that fetches field definitions from the backend
2. **Consistent UI** - Follows the same pattern as R&D module for consistency
3. **Responsive Design** - Works on desktop and mobile devices
4. **Type Safety** - Full TypeScript coverage for all entities
5. **Modular Structure** - Clean separation of concerns

## Getting Started

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Server runs on http://localhost:3014

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_MODULE=project_management
PROJECT_MANAGEMENT_BACKEND_URL=http://localhost:8014
```

## Dependencies

### Core
- Next.js 14.0.4
- React 18.2.0
- TypeScript 5.3.3

### UI Components
- Radix UI (Dialog, Select, Tabs)
- Lucide React (Icons)
- Tailwind CSS 3.4.0

### Utilities
- Axios 1.6.2
- date-fns 4.1.0
- Recharts 3.7.0

## Notes

- All entity forms use the DynamicEntityForm component
- Navigation uses SharedHeader for consistency with other modules
- API client includes both snake_case and camelCase versions for flexibility
- TypeScript interfaces match the backend entity schemas
