import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Briefcase, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import PassengerModal from './PassengerModal';
import PackageModal from './PackageModal';
import LuggageModal from './LuggageModal';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Passenger {
  id: number;
  personId: number;
  personName: string;
  pickupAddressId: number;
  pickupAddress: string;
  dropoffAddressId: number;
  dropoffAddress: string;
  luggage: Luggage[];
}

interface Package {
  id: number;
  description: string;
  senderId: number;
  senderName: string;
  recipientId: number;
  recipientName: string;
  pickupAddressId: number;
  pickupAddress: string;
  deliveryAddressId: number;
  deliveryAddress: string;
}

interface Luggage {
  id: number;
  description: string;
  weight?: number;
}

const mockTripDetails = {
  1: {
    id: 1,
    origin: 'São Paulo',
    destination: 'Rio de Janeiro',
    date: '2025-10-28',
    departureTime: '08:00',
    arrivalTime: '14:00',
    busPlate: 'ABC-1234',
    busModel: 'Mercedes-Benz O500',
    status: 'upcoming',
  },
};

const mockPassengers: Passenger[] = [
  {
    id: 1,
    personId: 1,
    personName: 'João Silva',
    pickupAddressId: 1,
    pickupAddress: 'Av. Paulista, 1000 - São Paulo, SP',
    dropoffAddressId: 2,
    dropoffAddress: 'Rua Atlântica, 500 - Rio de Janeiro, RJ',
    luggage: [
      { id: 1, description: 'Suitcase', weight: 20 },
      { id: 2, description: 'Backpack', weight: 5 },
    ],
  },
  {
    id: 2,
    personId: 2,
    personName: 'Maria Santos',
    pickupAddressId: 3,
    pickupAddress: 'Rua Augusta, 200 - São Paulo, SP',
    dropoffAddressId: 4,
    dropoffAddress: 'Av. Copacabana, 300 - Rio de Janeiro, RJ',
    luggage: [{ id: 3, description: 'Travel bag', weight: 15 }],
  },
];

const mockPackages: Package[] = [
  {
    id: 1,
    description: 'Electronic Equipment',
    senderId: 3,
    senderName: 'Tech Store SP',
    recipientId: 4,
    recipientName: 'Electronics RJ',
    pickupAddressId: 5,
    pickupAddress: 'Rua Comercial, 100 - São Paulo, SP',
    deliveryAddressId: 6,
    deliveryAddress: 'Av. Industrial, 400 - Rio de Janeiro, RJ',
  },
  {
    id: 2,
    description: 'Documents Package',
    senderId: 5,
    senderName: 'Law Firm SP',
    recipientId: 6,
    recipientName: 'Court Office RJ',
    pickupAddressId: 7,
    pickupAddress: 'Rua Jurídica, 50 - São Paulo, SP',
    deliveryAddressId: 8,
    deliveryAddress: 'Praça Central, 25 - Rio de Janeiro, RJ',
  },
];

export default function TripDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [passengers, setPassengers] = useState<Passenger[]>(mockPassengers);
  const [packages, setPackages] = useState<Package[]>(mockPackages);
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isLuggageModalOpen, setIsLuggageModalOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: 'passenger' | 'package'; item: any } | null>(null);
  const [passengerSearchTerm, setPassengerSearchTerm] = useState('');
  const [packageSearchTerm, setPackageSearchTerm] = useState('');

  const trip = mockTripDetails[1];

  if (!trip) {
    return <div>Trip not found</div>;
  }

  const handleSavePassenger = (passengerData: any) => {
    if (selectedPassenger) {
      setPassengers(
        passengers.map((p) =>
          p.id === selectedPassenger.id ? { ...p, ...passengerData } : p
        )
      );
    } else {
      const newPassenger: Passenger = {
        id: Math.max(...passengers.map((p) => p.id), 0) + 1,
        luggage: [],
        ...passengerData,
      };
      setPassengers([...passengers, newPassenger]);
    }
    setIsPassengerModalOpen(false);
    setSelectedPassenger(null);
  };

  const handleSavePackage = (packageData: any) => {
    if (selectedPackage) {
      setPackages(
        packages.map((p) => (p.id === selectedPackage.id ? { ...p, ...packageData } : p))
      );
    } else {
      const newPackage: Package = {
        id: Math.max(...packages.map((p) => p.id), 0) + 1,
        ...packageData,
      };
      setPackages([...packages, newPackage]);
    }
    setIsPackageModalOpen(false);
    setSelectedPackage(null);
  };

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      if (deleteItem.type === 'passenger') {
        setPassengers(passengers.filter((p) => p.id !== deleteItem.item.id));
      } else {
        setPackages(packages.filter((p) => p.id !== deleteItem.item.id));
      }
      setDeleteItem(null);
    }
  };

  const openLuggageModal = (passenger: Passenger) => {
    setSelectedPassenger(passenger);
    setIsLuggageModalOpen(true);
  };

  const handleSaveLuggage = (luggage: Luggage[]) => {
    if (selectedPassenger) {
      setPassengers(
        passengers.map((p) =>
          p.id === selectedPassenger.id ? { ...p, luggage } : p
        )
      );
      setIsLuggageModalOpen(false);
      setSelectedPassenger(null);
    }
  };

  // Filter passengers by search term
  const filteredPassengers = passengers.filter((passenger) => {
    const searchLower = passengerSearchTerm.toLowerCase();
    const nameMatch = passenger.personName.toLowerCase().includes(searchLower);
    const luggageMatch = passenger.luggage.some((item) =>
      item.description.toLowerCase().includes(searchLower)
    );
    return nameMatch || luggageMatch;
  });

  // Filter packages by search term
  const filteredPackages = packages.filter((pkg) => {
    const searchLower = packageSearchTerm.toLowerCase();
    return (
      pkg.description.toLowerCase().includes(searchLower) ||
      pkg.senderName.toLowerCase().includes(searchLower) ||
      pkg.recipientName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/trips')}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2>Trip Details</h2>
          <p className="text-muted-foreground mt-1">
            {trip.origin} → {trip.destination}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-muted-foreground">Origin</p>
              <p>{trip.origin}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Destination</p>
              <p>{trip.destination}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p>{new Date(trip.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="capitalize">{trip.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Departure</p>
              <p>{trip.departureTime}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Arrival</p>
              <p>{trip.arrivalTime}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Bus</p>
              <p>{trip.busPlate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p>{trip.busModel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="passengers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="passengers">Passengers</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="passengers" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3>Passengers</h3>
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search passengers or luggage..."
                  value={passengerSearchTerm}
                  onChange={(e) => setPassengerSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedPassenger(null);
                  setIsPassengerModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Passenger
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passenger Name</TableHead>
                  <TableHead>Pickup Address</TableHead>
                  <TableHead>Drop-off Address</TableHead>
                  <TableHead>Luggage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPassengers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {passengerSearchTerm ? 'No passengers found matching your search' : 'No passengers yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPassengers.map((passenger) => (
                    <TableRow key={passenger.id}>
                      <TableCell>{passenger.personName}</TableCell>
                      <TableCell>{passenger.pickupAddress}</TableCell>
                      <TableCell>{passenger.dropoffAddress}</TableCell>
                      <TableCell>{passenger.luggage.length} items</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openLuggageModal(passenger)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Briefcase className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPassenger(passenger);
                              setIsPassengerModalOpen(true);
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ type: 'passenger', item: passenger })}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3>Packages</h3>
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search packages, sender or recipient..."
                  value={packageSearchTerm}
                  onChange={(e) => setPackageSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedPackage(null);
                  setIsPackageModalOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Package
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {packageSearchTerm ? 'No packages found matching your search' : 'No packages yet'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>{pkg.description}</TableCell>
                      <TableCell>{pkg.senderName}</TableCell>
                      <TableCell>{pkg.recipientName}</TableCell>
                      <TableCell>{pkg.pickupAddress}</TableCell>
                      <TableCell>{pkg.deliveryAddress}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setIsPackageModalOpen(true);
                            }}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteItem({ type: 'package', item: pkg })}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <PassengerModal
        isOpen={isPassengerModalOpen}
        onClose={() => {
          setIsPassengerModalOpen(false);
          setSelectedPassenger(null);
        }}
        onSave={handleSavePassenger}
        passenger={selectedPassenger}
      />

      <PackageModal
        isOpen={isPackageModalOpen}
        onClose={() => {
          setIsPackageModalOpen(false);
          setSelectedPackage(null);
        }}
        onSave={handleSavePackage}
        package={selectedPackage}
      />

      <LuggageModal
        isOpen={isLuggageModalOpen}
        onClose={() => {
          setIsLuggageModalOpen(false);
          setSelectedPassenger(null);
        }}
        onSave={handleSaveLuggage}
        luggage={selectedPassenger?.luggage || []}
        passengerName={selectedPassenger?.personName || ''}
      />

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteItem?.type === 'passenger' ? 'Passenger' : 'Package'}`}
        description={`Are you sure you want to delete this ${deleteItem?.type}? This action cannot be undone.`}
      />
    </div>
  );
}
