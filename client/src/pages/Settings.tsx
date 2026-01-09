import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Building2, Users, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export default function Settings() {
  const { user } = useAuth();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "chemist" | "viewer">("chemist");

  // Fetch organization users
  const { data: users = [], refetch: refetchUsers } = trpc.users.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch organization info
  const { data: organization } = trpc.organizations.get.useQuery(undefined, {
    enabled: !!user,
  });

  const inviteUserMutation = trpc.users.invite.useMutation({
    onSuccess: () => {
      toast.success("User invited successfully");
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("chemist");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to invite user: ${error.message}`);
    },
  });

  const updateUserRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });

  const removeUserMutation = trpc.users.remove.useMutation({
    onSuccess: () => {
      toast.success("User removed successfully");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to remove user: ${error.message}`);
    },
  });

  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }
    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleUpdateRole = (userId: string, newRole: "admin" | "manager" | "chemist" | "viewer") => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm("Are you sure you want to remove this user?")) {
      removeUserMutation.mutate({ userId });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "secondary";
      case "chemist":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="container py-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your organization and team settings
            </p>
          </div>
        </div>

        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                  View and manage your organization information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={organization?.name || ""}
                    disabled
                    placeholder="Organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization ID</Label>
                  <Input
                    value={organization?.id || ""}
                    disabled
                    placeholder="Organization ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Created At</Label>
                  <Input
                    value={
                      organization?.createdAt
                        ? new Date(organization.createdAt).toLocaleDateString()
                        : ""
                    }
                    disabled
                    placeholder="Creation date"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage users and their roles in your organization
                    </CardDescription>
                  </div>
                  {user?.role === "admin" && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Users className="h-4 w-4 mr-2" />
                          Invite User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite User</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your organization
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="user@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                              value={inviteRole}
                              onValueChange={(value: any) => setInviteRole(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="chemist">Chemist</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setInviteDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleInviteUser}
                            disabled={inviteUserMutation.isPending}
                          >
                            {inviteUserMutation.isPending ? "Inviting..." : "Send Invitation"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      {user?.role === "admin" && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name || "—"}</TableCell>
                          <TableCell>{u.email || "—"}</TableCell>
                          <TableCell>
                            {user?.role === "admin" && u.id !== user.id ? (
                              <Select
                                value={u.role}
                                onValueChange={(value: any) => handleUpdateRole(u.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="chemist">Chemist</SelectItem>
                                  <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={getRoleBadgeVariant(u.role)}>
                                {u.role}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          {user?.role === "admin" && (
                            <TableCell>
                              {u.id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveUser(u.id)}
                                  disabled={removeUserMutation.isPending}
                                >
                                  Remove
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
