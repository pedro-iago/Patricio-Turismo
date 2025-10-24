import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface BusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bus: any) => void;
  bus?: any;
}

export default function BusModal({ isOpen, onClose, onSave, bus }: BusModalProps) {
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    capacity: '',
    status: 'active',
  });

  useEffect(() => {
    if (bus) {
      setFormData({
        plate: bus.plate || '',
        model: bus.model || '',
        capacity: bus.capacity?.toString() || '',
        status: bus.status || 'active',
      });
    } else {
      setFormData({
        plate: '',
        model: '',
        capacity: '',
        status: 'active',
      });
    }
  }, [bus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      capacity: parseInt(formData.capacity),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{bus ? 'Edit Bus' : 'New Bus'}</DialogTitle>
          <DialogDescription>
            {bus ? 'Update bus information below.' : 'Add a new bus to your fleet.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plate">License Plate</Label>
            <Input
              id="plate"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              placeholder="ABC-1234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Mercedes-Benz O500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (seats)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="42"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {bus ? 'Update' : 'Create'} Bus
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
