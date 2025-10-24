import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (passenger: any) => void;
  passenger?: any;
}

const mockPeople = [
  { id: 1, name: 'João Silva', document: '123.456.789-00' },
  { id: 2, name: 'Maria Santos', document: '987.654.321-00' },
  { id: 3, name: 'Pedro Oliveira', document: '456.789.123-00' },
  { id: 4, name: 'Ana Costa', document: '321.654.987-00' },
];

const mockAddresses = [
  { id: 1, address: 'Av. Paulista, 1000 - São Paulo, SP' },
  { id: 2, address: 'Rua Atlântica, 500 - Rio de Janeiro, RJ' },
  { id: 3, address: 'Rua Augusta, 200 - São Paulo, SP' },
  { id: 4, address: 'Av. Copacabana, 300 - Rio de Janeiro, RJ' },
  { id: 5, address: 'Rua Comercial, 100 - São Paulo, SP' },
  { id: 6, address: 'Av. Industrial, 400 - Rio de Janeiro, RJ' },
];

export default function PassengerModal({ isOpen, onClose, onSave, passenger }: PassengerModalProps) {
  const [formData, setFormData] = useState({
    personId: '',
    pickupAddressId: '',
    dropoffAddressId: '',
  });

  useEffect(() => {
    if (passenger) {
      setFormData({
        personId: passenger.personId?.toString() || '',
        pickupAddressId: passenger.pickupAddressId?.toString() || '',
        dropoffAddressId: passenger.dropoffAddressId?.toString() || '',
      });
    } else {
      setFormData({
        personId: '',
        pickupAddressId: '',
        dropoffAddressId: '',
      });
    }
  }, [passenger, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPerson = mockPeople.find((p) => p.id.toString() === formData.personId);
    const selectedPickup = mockAddresses.find((a) => a.id.toString() === formData.pickupAddressId);
    const selectedDropoff = mockAddresses.find((a) => a.id.toString() === formData.dropoffAddressId);

    onSave({
      personId: parseInt(formData.personId),
      personName: selectedPerson?.name || '',
      pickupAddressId: parseInt(formData.pickupAddressId),
      pickupAddress: selectedPickup?.address || '',
      dropoffAddressId: parseInt(formData.dropoffAddressId),
      dropoffAddress: selectedDropoff?.address || '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{passenger ? 'Edit Passenger' : 'Add Passenger'}</DialogTitle>
          <DialogDescription>
            {passenger ? 'Update passenger information and addresses.' : 'Select a passenger and their pickup/dropoff addresses.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person">Passenger</Label>
            <Select
              value={formData.personId}
              onValueChange={(value) => setFormData({ ...formData, personId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {mockPeople.map((person) => (
                  <SelectItem key={person.id} value={person.id.toString()}>
                    {person.name} - {person.document}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="dropoff">Drop-off Address</Label>
            <Select
              value={formData.dropoffAddressId}
              onValueChange={(value) => setFormData({ ...formData, dropoffAddressId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select drop-off address" />
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
              {passenger ? 'Update' : 'Add'} Passenger
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
