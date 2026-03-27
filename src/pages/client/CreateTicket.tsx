import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { createTicket } from '../../services/ticketService';
import { TicketPriority } from '../../types';
import { Input, Textarea, Select } from '../../components/Input';
import { Button } from '../../components/Button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { createTicketSchema } from '../../schemas/validation';
import { z } from 'zod';

export const CreateTicket = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("File size must be less than 5MB", "error");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast("Only JPG, PNG, and WebP images are allowed", "error");
        return;
      }
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      // Validate form data
      createTicketSchema.parse({ title, description, priority });
      setErrors({});
      setLoading(true);

      const ticketId = await createTicket({
        title,
        description,
        priority,
        clientId: currentUser.uid,
        clientName: currentUser.displayName,
        clientEmail: currentUser.email,
        adminId: 'admin_placeholder' // In a real app, this might be assigned dynamically
      }, screenshot || undefined);

      showToast("Ticket created successfully", "success");
      navigate(`/client/tickets/${ticketId}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        (error as z.ZodError<any>).issues.forEach(err => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
      } else {
        showToast(error instanceof Error ? error.message : "Failed to create ticket", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submit a New Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">Please provide as much detail as possible to help us resolve your issue quickly.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          <Input
            label="Ticket Title"
            placeholder="Brief summary of the issue"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            required
            maxLength={200}
          />

          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            error={errors.priority}
            required
            options={[
              { value: 'LOW', label: 'Low - Minor issue, no immediate impact' },
              { value: 'MEDIUM', label: 'Medium - Standard request or issue' },
              { value: 'HIGH', label: 'High - Critical issue blocking work' }
            ]}
          />

          <Textarea
            label="Description"
            placeholder="Describe the issue in detail. Steps to reproduce, expected behavior, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            required
            rows={6}
            maxLength={5000}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Screenshot (Optional)
            </label>
            
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300" />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
