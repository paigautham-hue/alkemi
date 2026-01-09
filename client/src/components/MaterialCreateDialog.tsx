import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MaterialCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MaterialCreateDialog({ open, onOpenChange }: MaterialCreateDialogProps) {
  const utils = trpc.useUtils();
  const { data: domains } = trpc.domains.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    tradeName: "",
    category: "",
    casNumber: "",
    domainId: "",
    supplierId: "",
    supplierProductCode: "",
    density: "",
    viscosity: "",
    molecularWeight: "",
    hansenD: "",
    hansenP: "",
    hansenH: "",
    costPerKg: "",
    currency: "USD",
    isActive: true,
  });

  const createMaterial = trpc.materials.create.useMutation({
    onSuccess: () => {
      toast.success("Material created successfully");
      utils.materials.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create material: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      tradeName: "",
      category: "",
      casNumber: "",
      domainId: "",
      supplierId: "",
      supplierProductCode: "",
      density: "",
      viscosity: "",
      molecularWeight: "",
      hansenD: "",
      hansenP: "",
      hansenH: "",
      costPerKg: "",
      currency: "USD",
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.domainId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload: any = {
      code: formData.code,
      name: formData.name,
      domainId: formData.domainId,
      isActive: formData.isActive,
    };

    // Add optional fields only if they have values
    if (formData.tradeName) payload.tradeName = formData.tradeName;
    if (formData.category) payload.category = formData.category;
    if (formData.casNumber) payload.casNumber = formData.casNumber;
    if (formData.supplierId) payload.supplierId = formData.supplierId;
    if (formData.supplierProductCode) payload.supplierProductCode = formData.supplierProductCode;
    if (formData.density) payload.density = formData.density;
    if (formData.viscosity) payload.viscosity = formData.viscosity;
    if (formData.molecularWeight) payload.molecularWeight = formData.molecularWeight;
    if (formData.hansenD) payload.hansenD = formData.hansenD;
    if (formData.hansenP) payload.hansenP = formData.hansenP;
    if (formData.hansenH) payload.hansenH = formData.hansenH;
    if (formData.costPerKg) {
      payload.costPerKg = formData.costPerKg;
      payload.currency = formData.currency;
    }

    createMaterial.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Create a new material in your library with properties and supplier information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Material Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., MAT-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Material Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Titanium Dioxide"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tradeName">Trade Name</Label>
                <Input
                  id="tradeName"
                  value={formData.tradeName}
                  onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                  placeholder="e.g., TiO2-R902"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Pigment"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="casNumber">CAS Number</Label>
                <Input
                  id="casNumber"
                  value={formData.casNumber}
                  onChange={(e) => setFormData({ ...formData, casNumber: e.target.value })}
                  placeholder="e.g., 13463-67-7"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">
                  Domain <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.domainId} onValueChange={(value) => setFormData({ ...formData, domainId: value })}>
                  <SelectTrigger id="domain">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains?.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={formData.supplierId} onValueChange={(value) => setFormData({ ...formData, supplierId: value })}>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierProductCode">Supplier Product Code</Label>
                <Input
                  id="supplierProductCode"
                  value={formData.supplierProductCode}
                  onChange={(e) => setFormData({ ...formData, supplierProductCode: e.target.value })}
                  placeholder="e.g., SP-12345"
                />
              </div>
            </div>
          </div>

          {/* Physical Properties */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Physical Properties</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="density">Density (g/cm³)</Label>
                <Input
                  id="density"
                  type="number"
                  step="0.001"
                  value={formData.density}
                  onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                  placeholder="e.g., 1.25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="viscosity">Viscosity (cP)</Label>
                <Input
                  id="viscosity"
                  type="number"
                  step="0.1"
                  value={formData.viscosity}
                  onChange={(e) => setFormData({ ...formData, viscosity: e.target.value })}
                  placeholder="e.g., 100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="molecularWeight">Molecular Weight (g/mol)</Label>
                <Input
                  id="molecularWeight"
                  type="number"
                  step="0.01"
                  value={formData.molecularWeight}
                  onChange={(e) => setFormData({ ...formData, molecularWeight: e.target.value })}
                  placeholder="e.g., 79.87"
                />
              </div>
            </div>
          </div>

          {/* Hansen Solubility Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Hansen Solubility Parameters</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hansenD">δD (Dispersion)</Label>
                <Input
                  id="hansenD"
                  type="number"
                  step="0.1"
                  value={formData.hansenD}
                  onChange={(e) => setFormData({ ...formData, hansenD: e.target.value })}
                  placeholder="e.g., 18.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hansenP">δP (Polar)</Label>
                <Input
                  id="hansenP"
                  type="number"
                  step="0.1"
                  value={formData.hansenP}
                  onChange={(e) => setFormData({ ...formData, hansenP: e.target.value })}
                  placeholder="e.g., 6.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hansenH">δH (Hydrogen bonding)</Label>
                <Input
                  id="hansenH"
                  type="number"
                  step="0.1"
                  value={formData.hansenH}
                  onChange={(e) => setFormData({ ...formData, hansenH: e.target.value })}
                  placeholder="e.g., 8.0"
                />
              </div>
            </div>
          </div>

          {/* Cost Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Cost Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPerKg">Cost per kg</Label>
                <Input
                  id="costPerKg"
                  type="number"
                  step="0.01"
                  value={formData.costPerKg}
                  onChange={(e) => setFormData({ ...formData, costPerKg: e.target.value })}
                  placeholder="e.g., 25.50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMaterial.isPending}>
              {createMaterial.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Material
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
