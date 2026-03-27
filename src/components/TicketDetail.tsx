import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { getTicketById, updateTicketStatus } from '../services/ticketService';
import { getCommentsForTicket, addComment } from '../services/commentService';
import { Ticket, Comment, TicketStatus } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import { Textarea } from './Input';
import { Clock, AlertCircle, CheckCircle2, MessageSquare, Send, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns'; // You might need to install date-fns

export const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchTicket = async () => {
      try {
        const fetchedTicket = await getTicketById(id);
        if (!fetchedTicket) {
          showToast("Ticket not found", "error");
          navigate(-1);
          return;
        }
        setTicket(fetchedTicket);
      } catch (error) {
        showToast("Failed to load ticket details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();

    const unsubscribe = getCommentsForTicket(id, (fetchedComments) => {
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [id, navigate, showToast]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || !id) return;
    setUpdatingStatus(true);
    try {
      await updateTicketStatus(id, newStatus);
      setTicket({ ...ticket, status: newStatus });
      showToast(`Status updated to ${newStatus.replace('_', ' ')}`, "success");
    } catch (error) {
      showToast("Failed to update status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    setSubmittingComment(true);
    try {
      await addComment(id, newComment);
      setNewComment('');
      showToast("Comment added", "success");
    } catch (error) {
      showToast("Failed to add comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading ticket details..." />;
  if (!ticket) return null;

  const isAdmin = currentUser?.role === 'ADMIN';

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'NEW': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'RESOLVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Tickets
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(ticket.status)}
                  <span className="text-sm font-medium text-gray-500 font-mono">#{ticket.id.slice(0, 8)}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {ticket.createdAt.toLocaleString()}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{ticket.title}</h1>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {ticket.screenshotUrl && (
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" /> Attached Screenshot
                </h3>
                <a href={ticket.screenshotUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                  <img src={ticket.screenshotUrl} alt="Ticket attachment" className="max-w-full h-auto max-h-96 object-contain bg-white" />
                </a>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Discussion</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No comments yet. Be the first to reply.</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className={`flex gap-4 ${comment.userId === currentUser?.uid ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm ${
                        comment.userRole === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className={`flex flex-col max-w-[80%] ${comment.userId === currentUser?.uid ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                        <span className="text-xs text-gray-500">
                          {/* Requires date-fns, fallback to toLocaleString if not installed */}
                          {comment.createdAt.toLocaleString()}
                        </span>
                      </div>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${
                        comment.userId === currentUser?.uid 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <form onSubmit={handleAddComment}>
                <Textarea
                  placeholder="Type your reply here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="mb-3"
                />
                <div className="flex justify-end">
                  <Button type="submit" isLoading={submittingComment} disabled={!newComment.trim()} className="gap-2">
                    <Send className="w-4 h-4" /> Send Reply
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Ticket Details</h3>
            
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  {isAdmin ? (
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                      disabled={updatingStatus}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {ticket.status.replace('_', ' ')}
                    </span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ticket.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    ticket.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ticket.priority}
                  </span>
                </dd>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Client</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.clientName}</dd>
                <dd className="text-sm text-gray-500">{ticket.clientEmail}</dd>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{ticket.createdAt.toLocaleString()}</dd>
              </div>
              
              {ticket.closedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Resolved</dt>
                  <dd className="mt-1 text-sm text-gray-900">{ticket.closedAt.toLocaleString()}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
