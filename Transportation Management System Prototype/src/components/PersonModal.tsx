import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: any) => void;
  person?: any;
}

export default function PersonModal({ isOpen, onClose, onSave, person }: PersonModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    type: 'client',
  });

  useEffect(() => {
    if (person) {
      setFormData({
        name: person.name || '',
        document: person.document || '',
        phone: person.phone || '',
        email: person.email || '',
        type: person.type || 'client',
      });
    } else {
      setFormData({
        name: '',
        document: '',
        phone: '',
        email: '',
        type: 'client',
      });
    }
  }, [person, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'New Person'}</DialogTitle>
          <DialogDescription>
            {person ? 'Update person information below.' : 'Enter information to register a new person in the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document">Document (CPF/CNPJ)</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="sender">Sender</SelectItem>
                  <SelectItem value="recipient">Recipient</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {person ? 'Update' : 'Create'} Person
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
