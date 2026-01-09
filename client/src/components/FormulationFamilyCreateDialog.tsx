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

interface FormulationFamilyCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormulationFamilyCreateDialog({
  open,
  onOpenChange,
}: FormulationFamilyCreateDialogProps) {
  const utils = trpc.useUtils();
  const { data: domains } = trpc.domains.list.useQuery();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    domainId: "",
    targetApplication: "",
    confidentialityLevel: "internal" as "public" | "internal" | "confidential" | "highly_confidential",
  });

  const createFamily = trpc.formulations.createFamily.useMutation({
    onSuccess: () => {
      toast.success("Formulation family created successfully");
      utils.formulations.listFamilies.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create formulation family: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      domainId: "",
      targetApplication: "",
      confidentialityLevel: "internal",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.domainId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload: any = {
      name: formData.name,
      domainId: formData.domainId,
      confidentialityLevel: formData.confidentialityLevel,
    };

    if (formData.description) payload.description = formData.description;
    if (formData.targetApplication) payload.targetApplication = formData.targetApplication;

    createFamily.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Formulation Family</DialogTitle>
          <DialogDescription>
            Create a new formulation family to organize related formulation versions
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Family Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., High-Gloss UV Coating"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the purpose and characteristics of this formulation family"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">
                  Domain <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.domainId}
                  onValueChange={(value) => setFormData({ ...formData, domainId: value })}
                >
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

              <div className="space-y-2">
                <Label htmlFor="confidentialityLevel">Confidentiality Level</Label>
                <Select
                  value={formData.confidentialityLevel}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, confidentialityLevel: value })
                  }
                >
                  <SelectTrigger id="confidentialityLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="highly_confidential">Highly Confidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetApplication">Target Application</Label>
              <Input
                id="targetApplication"
                value={formData.targetApplication}
                onChange={(e) => setFormData({ ...formData, targetApplication: e.target.value })}
                placeholder="e.g., Flexible packaging, Wood coatings"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFamily.isPending}>
              {createFamily.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Family
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
