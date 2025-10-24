import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: any) => void;
  address?: any;
}

export default function AddressModal({ isOpen, onClose, onSave, address }: AddressModalProps) {
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (address) {
      setFormData({
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
      });
    } else {
      setFormData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      });
    }
  }, [address, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'New Address'}</DialogTitle>
          <DialogDescription>
            {address ? 'Update address details below.' : 'Enter the complete address information.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="Av. Paulista"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Number</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="1000"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complement">Complement</Label>
            <Input
              id="complement"
              value={formData.complement}
              onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              placeholder="Apto 45, Bloco B (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Neighborhood</Label>
            <Input
              id="neighborhood"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              placeholder="Bela Vista"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="São Paulo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="SP"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="01310-100"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {address ? 'Update' : 'Create'} Address
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
