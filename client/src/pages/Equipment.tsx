import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Settings, Trash2, Plus, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Equipment() {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: equipment, isLoading, refetch } = trpc.equipment.list.useQuery();
  const { data: selectedEquipment } = trpc.equipment.get.useQuery(
    { id: selectedEquipmentId! },
    { enabled: !!selectedEquipmentId }
  );

  const createEquipmentMutation = trpc.equipment.create.useMutation({
    onSuccess: () => {
      toast.success("Equipment added successfully");
      setIsAddDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to add equipment: ${error.message}`);
    },
  });

  const deleteEquipmentMutation = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      toast.success("Equipment deleted");
      setSelectedEquipmentId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleAddEquipment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const capacity = formData.get("capacityValue") && formData.get("capacityUnit") ? {
      value: parseFloat(formData.get("capacityValue") as string),
      unit: formData.get("capacityUnit") as string
    } : undefined;

    const tempRange = formData.get("tempMin") && formData.get("tempMax") ? {
      min: parseFloat(formData.get("tempMin") as string),
      max: parseFloat(formData.get("tempMax") as string),
      unit: formData.get("tempUnit") as string || "°C"
    } : undefined;

    createEquipmentMutation.mutate({
      name: formData.get("name") as string,
      equipmentType: formData.get("equipmentType") as string,
      manufacturer: (formData.get("manufacturer") as string) || undefined,
      model: (formData.get("model") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
      capacity,
      operatingTemperatureRange: tempRange,
      status: (formData.get("status") as any) || "operational",
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedEquipmentId) return;
    if (confirm("Are you sure you want to delete this equipment?")) {
      deleteEquipmentMutation.mutate({ id: selectedEquipmentId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "maintenance": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "offline": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "decommissioned": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage manufacturing equipment and check formulation compatibility
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleAddEquipment}>
              <DialogHeader>
                <DialogTitle>Add Equipment</DialogTitle>
                <DialogDescription>
                  Add new manufacturing equipment to the system
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Equipment Name *</Label>
                    <Input id="name" name="name" required placeholder="High-speed mixer" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="equipmentType">Type *</Label>
                    <Input id="equipmentType" name="equipmentType" required placeholder="Mixer, Reactor, etc." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input id="manufacturer" name="manufacturer" placeholder="Company name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" name="model" placeholder="Model number" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="Building, Room, etc." />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2 col-span-2">
                    <Label htmlFor="capacityValue">Capacity</Label>
                    <Input id="capacityValue" name="capacityValue" type="number" step="0.01" placeholder="500" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacityUnit">Unit</Label>
                    <Input id="capacityUnit" name="capacityUnit" placeholder="L, kg, etc." />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Operating Temperature Range</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input name="tempMin" type="number" placeholder="Min" />
                    <Input name="tempMax" type="number" placeholder="Max" />
                    <Input name="tempUnit" placeholder="°C" defaultValue="°C" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="operational">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="decommissioned">Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEquipmentMutation.isPending}>
                  {createEquipmentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Equipment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Equipment List */}
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment ({equipment?.length || 0})</CardTitle>
              <CardDescription>Select equipment to view details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {equipment && equipment.length > 0 ? (
                <div className="divide-y">
                  {equipment.map((eq: any) => (
                    <button
                      key={eq.id}
                      onClick={() => setSelectedEquipmentId(eq.id)}
                      className={`w-full text-left p-4 hover:bg-accent transition-colors ${
                        selectedEquipmentId === eq.id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Settings className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{eq.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{eq.equipmentType}</p>
                          <Badge variant="outline" className={`mt-2 ${getStatusColor(eq.status)}`}>
                            {eq.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No equipment added yet</p>
                  <p className="text-sm mt-1">Click "Add Equipment" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Equipment Details */}
        <div className="col-span-8">
          {selectedEquipment ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{selectedEquipment.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedEquipment.equipmentType}
                      {selectedEquipment.manufacturer && ` • ${selectedEquipment.manufacturer}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Badge className={`mt-1 ${getStatusColor(selectedEquipment.status || "operational")}`}>
                      {selectedEquipment.status}
                    </Badge>
                  </div>
                  {selectedEquipment.location && (
                    <div>
                      <Label>Location</Label>
                      <p className="text-sm mt-1">{selectedEquipment.location}</p>
                    </div>
                  )}
                </div>

                {selectedEquipment.model && (
                  <div>
                    <Label>Model</Label>
                    <p className="text-sm mt-1">{selectedEquipment.model}</p>
                  </div>
                )}

                {selectedEquipment.capacity && (
                  <div>
                    <Label>Capacity</Label>
                    <p className="text-sm mt-1">
                      {selectedEquipment.capacity.value} {selectedEquipment.capacity.unit}
                    </p>
                  </div>
                )}

                {selectedEquipment.operatingTemperatureRange && (
                  <div>
                    <Label>Operating Temperature Range</Label>
                    <p className="text-sm mt-1">
                      {selectedEquipment.operatingTemperatureRange.min} - {selectedEquipment.operatingTemperatureRange.max} {selectedEquipment.operatingTemperatureRange.unit}
                    </p>
                  </div>
                )}

                {selectedEquipment.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{selectedEquipment.notes}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="h-4 w-4" />
                    <Label>Compatibility Analysis</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    To check formulation compatibility with this equipment, navigate to the Formulation Editor and use the "Check Equipment Compatibility" feature.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">Select equipment to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
