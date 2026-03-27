import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { getTicketsForClient } from '../../services/ticketService';
import { Ticket, TicketStatus, TicketPriority } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Plus, Search, Filter, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ClientDashboard = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'ALL', priority: 'ALL', search: '' });

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribe = getTicketsForClient(currentUser.uid, (fetchedTickets) => {
      setTickets(fetchedTickets);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const filteredTickets = tickets.filter(t => {
    const matchStatus = filter.status === 'ALL' || t.status === filter.status;
    const matchPriority = filter.priority === 'ALL' || t.priority === filter.priority;
    const matchSearch = t.title.toLowerCase().includes(filter.search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'NEW': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'RESOLVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    const styles = {
      NEW: 'bg-blue-100 text-blue-800 border-blue-200',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      RESOLVED: 'bg-green-100 text-green-800 border-green-200'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-orange-100 text-orange-800',
      HIGH: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your support requests</p>
        </div>
        
        <Button onClick={() => navigate('/client/tickets/new')} className="gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-3 pr-8"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1.5 pl-3 pr-8"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading your tickets..." />
        ) : filteredTickets.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No tickets found"
            description="You don't have any tickets matching your current filters."
            action={{
              label: "Create New Ticket",
              onClick: () => navigate('/client/tickets/new')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredTickets.map((ticket) => (
              <Link 
                key={ticket.id} 
                to={`/client/tickets/${ticket.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    {getStatusBadge(ticket.status)}
                  </div>
                  {getPriorityBadge(ticket.priority)}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {ticket.title}
                </h3>
                
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                  {ticket.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 font-mono mt-auto pt-4 border-t border-gray-100">
                  <span>#{ticket.id.slice(0, 8)}</span>
                  <span>{ticket.createdAt.toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
