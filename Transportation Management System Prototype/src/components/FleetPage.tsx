import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import BusModal from './BusModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Bus {
  id: number;
  plate: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
}

const mockBuses: Bus[] = [
  {
    id: 1,
    plate: 'ABC-1234',
    model: 'Mercedes-Benz O500',
    capacity: 42,
    status: 'active',
  },
  {
    id: 2,
    plate: 'XYZ-5678',
    model: 'Volvo 9700',
    capacity: 46,
    status: 'active',
  },
  {
    id: 3,
    plate: 'DEF-9012',
    model: 'Scania K360',
    capacity: 44,
    status: 'maintenance',
  },
  {
    id: 4,
    plate: 'GHI-3456',
    model: 'Marcopolo Paradiso',
    capacity: 48,
    status: 'active',
  },
];

export default function FleetPage() {
  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [deleteBus, setDeleteBus] = useState<Bus | null>(null);

  const handleCreateBus = (busData: Partial<Bus>) => {
    const newBus: Bus = {
      id: Math.max(...buses.map((b) => b.id), 0) + 1,
      ...busData as Bus,
    };
    setBuses([...buses, newBus]);
    setIsModalOpen(false);
  };

  const handleUpdateBus = (busData: Partial<Bus>) => {
    if (selectedBus) {
      setBuses(buses.map((bus) => (bus.id === selectedBus.id ? { ...bus, ...busData } : bus)));
      setSelectedBus(null);
      setIsModalOpen(false);
    }
  };

  const handleDeleteBus = () => {
    if (deleteBus) {
      setBuses(buses.filter((bus) => bus.id !== deleteBus.id));
      setDeleteBus(null);
    }
  };

  const openEditModal = (bus: Bus) => {
    setSelectedBus(bus);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedBus(null);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Fleet Management</h2>
          <p className="text-muted-foreground mt-1">Manage your bus fleet</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          New Bus
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buses.map((bus) => (
              <TableRow key={bus.id}>
                <TableCell>{bus.plate}</TableCell>
                <TableCell>{bus.model}</TableCell>
                <TableCell>{bus.capacity} seats</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(bus.status)}>
                    {bus.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(bus)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteBus(bus)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BusModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBus(null);
        }}
        onSave={selectedBus ? handleUpdateBus : handleCreateBus}
        bus={selectedBus}
      />

      <DeleteConfirmModal
        isOpen={!!deleteBus}
        onClose={() => setDeleteBus(null)}
        onConfirm={handleDeleteBus}
        title="Delete Bus"
        description={`Are you sure you want to delete bus ${deleteBus?.plate}? This action cannot be undone.`}
      />
    </div>
  );
}
