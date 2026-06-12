'use client';

import SharedHeader from './SharedHeader';
import {
  Beaker,
  FileText,
  Lightbulb,
  Award,
  Microscope,
  Users,
  Target,
  DollarSign,
  GitBranch,
  BookOpen,
  FlaskConical,
  Briefcase,
  Settings,
} from 'lucide-react';

// Navigation structure for R&D module - organized into logical groups
const navigationGroups = [
  // Core Research Activities
  {
    name: 'Research',
    icon: FlaskConical,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Projects',
        href: '/rd/projects',
        icon: Lightbulb,
      },
      {
        name: 'Experiments',
        href: '/rd/experiments',
        icon: Beaker,
      },
      {
        name: 'Prototypes',
        href: '/rd/prototypes',
        icon: Microscope,
      },
    ],
  },

  // Publications & IP
  {
    name: 'Publications',
    icon: BookOpen,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Research Papers',
        href: '/rd/research-papers',
        icon: BookOpen,
      },
      {
        name: 'Patents',
        href: '/rd/patents',
        icon: Award,
      },
    ],
  },

  // Resources Management
  {
    name: 'Resources',
    icon: Briefcase,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Lab Equipment',
        href: '/rd/lab-equipment',
        icon: FileText,
      },
      {
        name: 'Team Members',
        href: '/rd/team-members',
        icon: Users,
      },
      {
        name: 'Budgets',
        href: '/rd/budgets',
        icon: DollarSign,
      },
    ],
  },

  // Project Management
  {
    name: 'Management',
    icon: Target,
    type: 'dropdown' as const,
    items: [
      {
        name: 'Milestones',
        href: '/rd/milestones',
        icon: Target,
      },
      {
        name: 'Collaborations',
        href: '/rd/collaborations',
        icon: GitBranch,
      },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="Research & Development" navigationGroups={navigationGroups} />;
}
