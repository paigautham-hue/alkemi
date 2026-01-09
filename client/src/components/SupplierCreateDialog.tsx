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

interface SupplierCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SupplierCreateDialog({ open, onOpenChange }: SupplierCreateDialogProps) {
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    country: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    riskScore: "",
    qualificationStatus: "pending" as "pending" | "qualified" | "disqualified" | "under_review",
    notes: "",
  });

  const createSupplier = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier created successfully");
      utils.suppliers.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create supplier: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      country: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      riskScore: "",
      qualificationStatus: "pending",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload: any = {
      code: formData.code,
      name: formData.name,
      qualificationStatus: formData.qualificationStatus,
    };

    // Add optional fields only if they have values
    if (formData.country) payload.country = formData.country;
    if (formData.contactEmail) payload.contactEmail = formData.contactEmail;
    if (formData.contactPhone) payload.contactPhone = formData.contactPhone;
    if (formData.address) payload.address = formData.address;
    if (formData.riskScore) payload.riskScore = formData.riskScore;
    if (formData.notes) payload.notes = formData.notes;

    createSupplier.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Create a new supplier in your network with contact and qualification information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  Supplier Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., SUP-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  Supplier Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., BASF Corporation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country (ISO 2-letter code)</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                  placeholder="e.g., US"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualificationStatus">Qualification Status</Label>
                <Select
                  value={formData.qualificationStatus}
                  onValueChange={(value: any) => setFormData({ ...formData, qualificationStatus: value })}
                >
                  <SelectTrigger id="qualificationStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="disqualified">Disqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="e.g., sales@supplier.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="e.g., +1-555-0123"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Risk Assessment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskScore">Risk Score (0-100)</Label>
                <Input
                  id="riskScore"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.riskScore}
                  onChange={(e) => setFormData({ ...formData, riskScore: e.target.value })}
                  placeholder="e.g., 25.5"
                />
                <p className="text-xs text-muted-foreground">
                  Higher scores indicate higher risk
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this supplier"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSupplier.isPending}>
              {createSupplier.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
