'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Lightbulb } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.rd_projects.list();
      const projectsArray = Array.isArray(data) ? data : (data.projects || data.data || []);
      setProjects(projectsArray);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (project.project_name && project.project_name.toLowerCase().includes(search)) ||
      (project.project_code && project.project_code.toLowerCase().includes(search)) ||
      (project.research_area && project.research_area.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">R&D Projects</h1>
        </div>
        <Link href="/projects/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Project
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects by name, code, or research area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No R&D projects found</p>
            <Link href="/projects/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Code</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Project Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Research Area</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Priority</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Progress</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{project.project_code}</td>
                    <td className="py-3 px-4 text-black">{project.project_name}</td>
                    <td className="py-3 px-4 text-gray-600">{project.research_area}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{project.project_type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center capitalize">{project.priority || '-'}</td>
                    <td className="py-3 px-4 text-center">{project.progress_percentage || 0}%</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
