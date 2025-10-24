import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface Luggage {
  id: number;
  description: string;
  weight?: number;
}

interface LuggageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (luggage: Luggage[]) => void;
  luggage: Luggage[];
  passengerName: string;
}

export default function LuggageModal({
  isOpen,
  onClose,
  onSave,
  luggage,
  passengerName,
}: LuggageModalProps) {
  const [items, setItems] = useState<Luggage[]>([]);

  useEffect(() => {
    setItems(luggage.length > 0 ? [...luggage] : []);
  }, [luggage, isOpen]);

  const handleAddItem = () => {
    const newItem: Luggage = {
      id: Math.max(...items.map((i) => i.id), 0) + 1,
      description: '',
      weight: undefined,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: number, field: keyof Luggage, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(items);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Luggage - {passengerName}</DialogTitle>
          <DialogDescription>
            Add, edit, or remove luggage items for this passenger.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No luggage items. Click "Add Item" to add luggage.
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-end gap-3 p-4 bg-accent/30 rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`desc-${item.id}`}>Description</Label>
                    <Input
                      id={`desc-${item.id}`}
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateItem(item.id, 'description', e.target.value)
                      }
                      placeholder="e.g., Suitcase, Backpack"
                      required
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label htmlFor={`weight-${item.id}`}>Weight (kg)</Label>
                    <Input
                      id={`weight-${item.id}`}
                      type="number"
                      value={item.weight || ''}
                      onChange={(e) =>
                        handleUpdateItem(
                          item.id,
                          'weight',
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Save Luggage
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
