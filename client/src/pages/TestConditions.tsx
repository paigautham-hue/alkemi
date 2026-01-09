import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, FlaskConical, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function TestConditions() {
  const [open, setOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>();

  const { data: testConditionSets, isLoading } = trpc.testConditions.list.useQuery({
    domainId: selectedDomain,
  });
  const { data: domains } = trpc.domains.list.useQuery();

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Test Conditions</h1>
          <p className="text-muted-foreground mt-2">
            Manage test condition sets for predictions and trials
          </p>
        </div>
        <TestConditionCreateDialog open={open} onOpenChange={setOpen} />
      </div>

      <div className="mb-6">
        <Label>Filter by Domain</Label>
        <Select value={selectedDomain} onValueChange={setSelectedDomain}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {domains?.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading test conditions...</p>
        </div>
      ) : testConditionSets && testConditionSets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testConditionSets.map((set) => (
            <TestConditionCard key={set.id} testConditionSet={set} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FlaskConical className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No test conditions yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first test condition set to get started
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Test Condition Set
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TestConditionCard({ testConditionSet }: { testConditionSet: any }) {
  const utils = trpc.useUtils();
  const deleteMutation = trpc.testConditions.delete.useMutation({
    onSuccess: () => {
      toast.success("Test condition set deleted");
      utils.testConditions.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const { data: domainData } = trpc.domains.list.useQuery();
  const domain = domainData?.find((d) => d.id === testConditionSet.domainId);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{testConditionSet.name}</CardTitle>
            <CardDescription className="mt-1">
              {domain?.name || "Unknown domain"}
            </CardDescription>
          </div>
          {testConditionSet.isStandard && (
            <Badge variant="secondary">Standard</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {testConditionSet.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {testConditionSet.description}
          </p>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {new Date(testConditionSet.createdAt).toLocaleDateString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this test condition set?")) {
                deleteMutation.mutate({ id: testConditionSet.id });
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TestConditionCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [domainId, setDomainId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isStandard, setIsStandard] = useState(false);
  const [parameters, setParameters] = useState<
    Array<{ parameterName: string; parameterValue: string; unit: string }>
  >([{ parameterName: "", parameterValue: "", unit: "" }]);

  const { data: domains } = trpc.domains.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.testConditions.create.useMutation({
    onSuccess: () => {
      toast.success("Test condition set created successfully");
      utils.testConditions.list.invalidate();
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const resetForm = () => {
    setDomainId("");
    setName("");
    setDescription("");
    setIsStandard(false);
    setParameters([{ parameterName: "", parameterValue: "", unit: "" }]);
  };

  const addParameter = () => {
    setParameters([...parameters, { parameterName: "", parameterValue: "", unit: "" }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (
    index: number,
    field: "parameterName" | "parameterValue" | "unit",
    value: string
  ) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validParameters = parameters.filter(
      (p) => p.parameterName.trim() && p.parameterValue.trim()
    );

    if (!domainId || !name.trim() || validParameters.length === 0) {
      toast.error("Please fill in all required fields and add at least one parameter");
      return;
    }

    createMutation.mutate({
      domainId,
      name: name.trim(),
      description: description.trim() || undefined,
      isStandard,
      parameters: validParameters,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Test Condition Set
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Test Condition Set</DialogTitle>
            <DialogDescription>
              Define a set of test conditions for predictions and trials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Select value={domainId} onValueChange={setDomainId} required>
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
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Cure Conditions"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the test conditions..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isStandard"
                checked={isStandard}
                onCheckedChange={(checked) => setIsStandard(checked as boolean)}
              />
              <Label htmlFor="isStandard" className="font-normal">
                Mark as standard test condition
              </Label>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Parameters *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Parameter
                </Button>
              </div>

              <div className="space-y-3">
                {parameters.map((param, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Parameter name (e.g., Temperature)"
                        value={param.parameterName}
                        onChange={(e) =>
                          updateParameter(index, "parameterName", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Value (e.g., 23)"
                        value={param.parameterValue}
                        onChange={(e) =>
                          updateParameter(index, "parameterValue", e.target.value)
                        }
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        placeholder="Unit (e.g., °C)"
                        value={param.unit}
                        onChange={(e) => updateParameter(index, "unit", e.target.value)}
                      />
                    </div>
                    {parameters.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParameter(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
