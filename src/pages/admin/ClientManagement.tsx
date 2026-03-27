import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/Toast';
import { getAllClients, deleteUser } from '../../services/userService';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { Users, Mail, Building, Calendar, Trash2, UserPlus } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { z } from 'zod';
import { createUserSchema } from '../../schemas/validation';

export const ClientManagement = () => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{uid: string, name: string} | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const fetchedClients = await getAllClients();
      setClients(fetchedClients);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to load clients", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      await deleteUser(clientToDelete.uid);
      showToast(`Client ${clientToDelete.name} deactivated successfully`, "success");
      fetchClients(); // Refresh list
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to deactivate client", "error");
    } finally {
      setClientToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your clients</p>
        </div>
        
        <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite Client
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading clients..." />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="You haven't added any clients to your workspace yet."
            action={{
              label: "Invite your first client",
              onClick: () => setIsInviteModalOpen(true)
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-medium text-sm">
                            {client.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.displayName}</div>
                          <div className="text-xs text-gray-500 font-mono">ID: {client.uid.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {client.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {client.companyName || <span className="text-gray-400 italic">Not specified</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {client.createdAt.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setClientToDelete({uid: client.uid, name: client.displayName})}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="Deactivate Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal Placeholder - In a real app, this would trigger a Cloud Function to send an email */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Client"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Send an invitation email to a new client. They will receive a link to set their password and access their dashboard.
          </p>
          <Input label="Client Name" placeholder="John Doe" required />
          <Input label="Email Address" type="email" placeholder="john@example.com" required />
          <Input label="Company Name" placeholder="Acme Corp" />
          
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              showToast("Invitation sent successfully! (Simulated)", "success");
              setIsInviteModalOpen(false);
            }}>Send Invite</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Deactivate Client"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to deactivate <strong>{clientToDelete?.name}</strong>? They will no longer be able to log in.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setClientToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteClient}>Deactivate</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
