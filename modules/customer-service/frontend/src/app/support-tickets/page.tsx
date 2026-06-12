'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Ticket } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function SupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.support_tickets.list();
      const ticketsArray = Array.isArray(data) ? data : (data.support_tickets || data.data || []);
      setTickets(ticketsArray);
    } catch (error) {
      console.error('Failed to load support tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (ticket.ticket_number && ticket.ticket_number.toLowerCase().includes(search)) ||
      (ticket.subject && ticket.subject.toLowerCase().includes(search)) ||
      (ticket.customer_name && ticket.customer_name.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Support Tickets</h1>
        </div>
        <Link href="/support-tickets/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Ticket
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets by number, subject, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Tickets Table */}
      <div className="card">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No support tickets found</p>
            <Link href="/support-tickets/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Ticket #</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Created</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{ticket.ticket_number}</td>
                    <td className="py-3 px-4 text-black">{ticket.subject}</td>
                    <td className="py-3 px-4 text-gray-600">{ticket.customer_name}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 capitalize">
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{ticket.created_date ? new Date(ticket.created_date).toLocaleDateString() : '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/support-tickets/${ticket.id}`}
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
