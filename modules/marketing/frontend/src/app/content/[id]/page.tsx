"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Eye, Share2, User } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Content {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  excerpt: string | null;
  body: string | null;
  status: string;
  published_at: string | null;
  author: string | null;
  views: number;
  shares: number;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If accessing /content/new, redirect to the new page
    if (params.id === 'new') {
      router.push('/content/new');
      return;
    }
    fetchContent();
  }, [params.id]);

  const fetchContent = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/content/${params.id}` : `/api/content/${params.id}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      } else {
        router.push('/content');
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      router.push('/content');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "text-blue-600 bg-blue-50";
      case "draft": return "text-gray-600 bg-gray-100";
      case "archived": return "text-gray-500 bg-gray-50";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Content</span>
        </button>

        {/* Content Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getStatusColor(content.status)}`}>
              {content.status}
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {content.content_type.replace("_", " ")}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-black mb-4">{content.title}</h1>

          {content.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{content.excerpt}</p>
          )}

          {/* Meta Information */}
          <div className="flex items-center space-x-6 text-sm text-gray-600 border-t border-b border-gray-200 py-4">
            {content.author && (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{content.author}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>
                {content.published_at
                  ? new Date(content.published_at).toLocaleDateString()
                  : new Date(content.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>{content.views} views</span>
            </div>
            <div className="flex items-center space-x-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>{content.shares} shares</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose max-w-none">
          {content.body ? (
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {content.body}
            </div>
          ) : (
            <div className="text-gray-500 italic">No content body available</div>
          )}
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
