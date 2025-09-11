import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAuthenticated, isAdmin, createAuthenticatedRequest } from "@/lib/auth";
import { useLocation } from "wouter";
import { Users as UsersIcon, Mail, MapPin, Calendar, Phone, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Address {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  addresses: Address[];
}

export default function AdminUsers() {
  const [, navigate] = useLocation();
  const authenticated = isAuthenticated();
  const isAdminUser = isAdmin();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: authenticated && isAdminUser,
    queryFn: async () => {
      const response = await fetch("/api/admin/users", createAuthenticatedRequest("/api/admin/users"));
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  if (!authenticated || !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-4" data-testid="text-access-denied">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-6">
              {!authenticated 
                ? "Please log in to access the admin user management."
                : "You don't have permission to access the admin user management. Please contact an administrator."
              }
            </p>
          </div>
          <div className="space-y-3">
            {!authenticated ? (
              <Button onClick={() => navigate("/admin/login")} className="w-full" data-testid="button-admin-login">
                Go to Admin Login
              </Button>
            ) : (
              <Button onClick={() => navigate("/")} className="w-full" data-testid="button-home">
                Go to Home
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-page-title">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Manage users and their addresses ({users.length} total users)
          </p>
        </div>
        <Button onClick={() => navigate("/admin")} variant="outline" data-testid="button-back-dashboard">
          Back to Dashboard
        </Button>
      </div>

      <div className="grid gap-6">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2" data-testid={`text-username-${user.id}`}>
                    <UsersIcon className="h-5 w-5" />
                    {user.name}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1" data-testid={`text-email-${user.id}`}>
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} data-testid={`badge-role-${user.id}`}>
                    {user.role}
                  </Badge>
                  <Badge variant="outline" data-testid={`badge-addresses-${user.id}`}>
                    {user.addresses.length} address{user.addresses.length !== 1 ? 'es' : ''}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            {user.addresses.length > 0 && (
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Saved Addresses
                  </h4>
                  <div className="grid gap-3">
                    {user.addresses.map((address) => (
                      <div 
                        key={address.id} 
                        className={`p-3 rounded-lg border ${address.isDefault ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'}`}
                        data-testid={`address-card-${address.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{address.name}</span>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">Default</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Added {formatDate(address.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="font-medium" data-testid={`text-fullname-${address.id}`}>
                            {address.fullName}
                          </p>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {address.phone}
                          </p>
                          <p className="text-muted-foreground" data-testid={`text-address-${address.id}`}>
                            {address.addressLine1}
                            {address.addressLine2 && `, ${address.addressLine2}`}
                          </p>
                          <p className="text-muted-foreground">
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
            
            {user.addresses.length === 0 && (
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                <div className="text-center py-6 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No addresses saved yet</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {users.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
            <p className="text-muted-foreground">
              There are no users in the system yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}