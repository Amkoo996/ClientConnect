import React, { useState } from 'react';
import { useToast } from '../../components/Toast';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Mail, Send } from 'lucide-react';

export const InviteClient = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      // In a real application, this would call a Firebase Cloud Function
      // to send an email with a secure registration link.
      // For this MVP, we simulate the delay and success.
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showToast(`Invitation sent to ${email}`, "success");
      setEmail('');
    } catch (error) {
      showToast("Failed to send invitation", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-200 bg-gray-50">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Invite a Client</h1>
          <p className="text-sm text-gray-500 mt-2">
            Send an invitation link to your client so they can create an account and start submitting tickets.
          </p>
        </div>
        
        <div className="p-6 sm:p-8">
          <form onSubmit={handleInvite} className="space-y-6">
            <Input
              label="Client Email Address"
              type="email"
              placeholder="client@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              hint="We'll send a secure registration link to this address."
            />
            
            <div className="flex justify-end">
              <Button type="submit" isLoading={loading} className="gap-2">
                <Send className="w-4 h-4" /> Send Invitation
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
