import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: any) => void;
}

export const CreateProjectModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [pmId, setPmId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [pms, setPms] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api.get('/meta/clients').then(r => setClients(r.data)).catch(() => {});
    if (user?.role === 'ADMIN') {
      api.get('/meta/users?role=PM').then(r => setPms(r.data)).catch(() => {});
    }
  }, [isOpen]);

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return;
    try {
      const res = await api.post('/meta/clients', { name: newClientName.trim() });
      setClients(prev => [...prev, res.data]);
      setClientId(res.data.id);
      setNewClientName('');
      setShowNewClient(false);
    } catch {
      setError('Failed to create client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !clientId) { setError('Name and client are required'); return; }
    setLoading(true);
    try {
      const body: any = { name: name.trim(), clientId };
      if (user?.role === 'ADMIN' && pmId && pmId !== 'self') body.pmId = pmId;
      const res = await api.post('/projects', body);
      onCreated(res.data);
      setName(''); setClientId(''); setPmId('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setClientId('');
      setPmId('');
      setError('');
      setShowNewClient(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project and assign it to a client.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Client <span className="text-destructive">*</span></Label>
              <Button 
                type="button" 
                variant="link" 
                className="h-auto p-0 text-xs h-4" 
                onClick={() => setShowNewClient(!showNewClient)}
              >
                {showNewClient ? 'Select Existing' : '+ New Client'}
              </Button>
            </div>
            
            {showNewClient ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Client name"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                />
                <Button type="button" onClick={handleCreateClient} variant="secondary">
                  Add
                </Button>
              </div>
            ) : (
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {user?.role === 'ADMIN' && (
            <div className="space-y-2">
              <Label>Assign Project Manager</Label>
              <Select value={pmId} onValueChange={setPmId}>
                <SelectTrigger>
                  <SelectValue placeholder="Self (Admin manages)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self (Admin manages)</SelectItem>
                  {pms.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
