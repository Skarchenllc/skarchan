'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, HelpCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await api.knowledge_base.list();
      const articlesArray = Array.isArray(data) ? data : (data.knowledge_base || data.data || []);
      setArticles(articlesArray);
    } catch (error) {
      console.error('Failed to load knowledge base articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (article.article_title && article.article_title.toLowerCase().includes(search)) ||
      (article.category && article.category.toLowerCase().includes(search)) ||
      (article.keywords && article.keywords.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Knowledge Base</h1>
        </div>
        <Link href="/knowledge-base/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Article
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles by title, category, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Articles Table */}
      <div className="card">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No knowledge base articles found</p>
            <Link href="/knowledge-base/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Views</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Helpful</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{article.article_title}</td>
                    <td className="py-3 px-4 text-gray-600">{article.category}</td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{article.article_type}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {article.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{article.view_count || 0}</td>
                    <td className="py-3 px-4 text-center">{article.helpful_count || 0}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/knowledge-base/${article.id}`}
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
