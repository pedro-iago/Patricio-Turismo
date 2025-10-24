import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: any) => void;
  package?: any;
}

const mockPeople = [
  { id: 1, name: 'João Silva', type: 'client' },
  { id: 2, name: 'Maria Santos', type: 'client' },
  { id: 3, name: 'Tech Store SP', type: 'sender' },
  { id: 4, name: 'Electronics RJ', type: 'recipient' },
  { id: 5, name: 'Law Firm SP', type: 'sender' },
  { id: 6, name: 'Court Office RJ', type: 'recipient' },
];

const mockAddresses = [
  { id: 1, address: 'Av. Paulista, 1000 - São Paulo, SP' },
  { id: 2, address: 'Rua Atlântica, 500 - Rio de Janeiro, RJ' },
  { id: 3, address: 'Rua Augusta, 200 - São Paulo, SP' },
  { id: 4, address: 'Av. Copacabana, 300 - Rio de Janeiro, RJ' },
  { id: 5, address: 'Rua Comercial, 100 - São Paulo, SP' },
  { id: 6, address: 'Av. Industrial, 400 - Rio de Janeiro, RJ' },
  { id: 7, address: 'Rua Jurídica, 50 - São Paulo, SP' },
  { id: 8, address: 'Praça Central, 25 - Rio de Janeiro, RJ' },
];

export default function PackageModal({ isOpen, onClose, onSave, package: pkg }: PackageModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    senderId: '',
    recipientId: '',
    pickupAddressId: '',
    deliveryAddressId: '',
  });

  useEffect(() => {
    if (pkg) {
      setFormData({
        description: pkg.description || '',
        senderId: pkg.senderId?.toString() || '',
        recipientId: pkg.recipientId?.toString() || '',
        pickupAddressId: pkg.pickupAddressId?.toString() || '',
        deliveryAddressId: pkg.deliveryAddressId?.toString() || '',
      });
    } else {
      setFormData({
        description: '',
        senderId: '',
        recipientId: '',
        pickupAddressId: '',
        deliveryAddressId: '',
      });
    }
  }, [pkg, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sender = mockPeople.find((p) => p.id.toString() === formData.senderId);
    const recipient = mockPeople.find((p) => p.id.toString() === formData.recipientId);
    const pickup = mockAddresses.find((a) => a.id.toString() === formData.pickupAddressId);
    const delivery = mockAddresses.find((a) => a.id.toString() === formData.deliveryAddressId);

    onSave({
      description: formData.description,
      senderId: parseInt(formData.senderId),
      senderName: sender?.name || '',
      recipientId: parseInt(formData.recipientId),
      recipientName: recipient?.name || '',
      pickupAddressId: parseInt(formData.pickupAddressId),
      pickupAddress: pickup?.address || '',
      deliveryAddressId: parseInt(formData.deliveryAddressId),
      deliveryAddress: delivery?.address || '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{pkg ? 'Edit Package' : 'Add Package'}</DialogTitle>
          <DialogDescription>
            {pkg ? 'Update package details below.' : 'Enter package information including sender, recipient, and addresses.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter package description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender">Sender</Label>
              <Select
                value={formData.senderId}
                onValueChange={(value) => setFormData({ ...formData, senderId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sender" />
                </SelectTrigger>
                <SelectContent>
                  {mockPeople.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Select
                value={formData.recipientId}
                onValueChange={(value) => setFormData({ ...formData, recipientId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {mockPeople.map((person) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup">Pickup Address</Label>
            <Select
              value={formData.pickupAddressId}
              onValueChange={(value) => setFormData({ ...formData, pickupAddressId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pickup address" />
              </SelectTrigger>
              <SelectContent>
                {mockAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id.toString()}>
                    {address.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery">Delivery Address</Label>
            <Select
              value={formData.deliveryAddressId}
              onValueChange={(value) => setFormData({ ...formData, deliveryAddressId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery address" />
              </SelectTrigger>
              <SelectContent>
                {mockAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id.toString()}>
                    {address.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {pkg ? 'Update' : 'Add'} Package
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
