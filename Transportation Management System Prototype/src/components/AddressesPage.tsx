import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import AddressModal from './AddressModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Address {
  id: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

const mockAddresses: Address[] = [
  {
    id: 1,
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  },
  {
    id: 2,
    street: 'Rua Atlântica',
    number: '500',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22070-010',
  },
  {
    id: 3,
    street: 'Rua Augusta',
    number: '200',
    complement: 'Apto 45',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01305-000',
  },
  {
    id: 4,
    street: 'Av. Copacabana',
    number: '300',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zipCode: '22020-001',
  },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);

  const handleCreateAddress = (addressData: Partial<Address>) => {
    const newAddress: Address = {
      id: Math.max(...addresses.map((a) => a.id), 0) + 1,
      ...addressData as Address,
    };
    setAddresses([...addresses, newAddress]);
    setIsModalOpen(false);
  };

  const handleUpdateAddress = (addressData: Partial<Address>) => {
    if (selectedAddress) {
      setAddresses(
        addresses.map((address) =>
          address.id === selectedAddress.id ? { ...address, ...addressData } : address
        )
      );
      setSelectedAddress(null);
      setIsModalOpen(false);
    }
  };

  const handleDeleteAddress = () => {
    if (deleteAddress) {
      setAddresses(addresses.filter((address) => address.id !== deleteAddress.id));
      setDeleteAddress(null);
    }
  };

  const openEditModal = (address: Address) => {
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.number}${
      address.complement ? ' - ' + address.complement : ''
    }`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Address Management</h2>
          <p className="text-muted-foreground mt-1">Manage pickup and delivery addresses</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />
          New Address
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Street & Number</TableHead>
              <TableHead>Neighborhood</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>ZIP Code</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addresses.map((address) => (
              <TableRow key={address.id}>
                <TableCell>{formatAddress(address)}</TableCell>
                <TableCell>{address.neighborhood}</TableCell>
                <TableCell>{address.city}</TableCell>
                <TableCell>{address.state}</TableCell>
                <TableCell>{address.zipCode}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(address)}
                      className="hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteAddress(address)}
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

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAddress(null);
        }}
        onSave={selectedAddress ? handleUpdateAddress : handleCreateAddress}
        address={selectedAddress}
      />

      <DeleteConfirmModal
        isOpen={!!deleteAddress}
        onClose={() => setDeleteAddress(null)}
        onConfirm={handleDeleteAddress}
        title="Delete Address"
        description={`Are you sure you want to delete the address at ${
          deleteAddress ? formatAddress(deleteAddress) : ''
        }? This action cannot be undone.`}
      />
    </div>
  );
}
