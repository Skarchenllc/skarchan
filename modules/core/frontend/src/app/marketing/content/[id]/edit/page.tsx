"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import Navigation from "@/components/marketing/Navigation";

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content_type: "blog_post",
    excerpt: "",
    body: "",
    author: "",
    status: "draft",
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/content/${params.id}` : `/api/content/${params.id}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title || "",
          slug: data.slug || "",
          content_type: data.content_type || "blog_post",
          excerpt: data.excerpt || "",
          body: data.body || "",
          author: data.author || "",
          status: data.status || "draft",
        });
      } else {
        router.push('/marketing/content');
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      router.push('/marketing/content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/content/${params.id}` : `/api/content/${params.id}`;
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/marketing/content');
      } else {
        alert('Failed to update content');
      }
    } catch (error) {
      console.error("Error updating content:", error);
      alert('Error updating content');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Content
          </button>
        </div>

        {/* Form */}
        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Edit Content</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              {/* Slug */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono text-sm"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from title, but you can edit it</p>
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Content Type *
                </label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                  value={formData.content_type}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                >
                  <option value="blog_post">Blog Post</option>
                  <option value="landing_page">Landing Page</option>
                  <option value="email_template">Email Template</option>
                  <option value="social_post">Social Media Post</option>
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                </select>
              </div>

              {/* Author */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Author
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Status *
              </label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Excerpt
              </label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="A brief summary of the content..."
              />
            </div>

            {/* Content Body */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Content Body
              </label>
              <textarea
                rows={12}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600 font-mono text-sm"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Write your content here..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-200 text-black rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update Content'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
