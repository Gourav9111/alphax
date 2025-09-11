import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isAuthenticated, getCurrentUser, createAuthenticatedRequest } from "@/lib/auth";
import { useLocation } from "wouter";
import { User, Package, Clock, CheckCircle, XCircle, MapPin, Plus, Home, Edit, Trash2, Phone } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string;
  status: string;
  total: string;
  items: Array<{
    productId: string;
    quantity: number;
    name: string;
    price: string;
    size?: string;
    color?: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  paymentStatus: string;
  createdAt: string;
}

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

const addressSchema = z.object({
  name: z.string().min(2, "Address name must be at least 2 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  addressLine1: z.string().min(10, "Please enter your full address"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Please enter your city"),
  state: z.string().min(2, "Please enter your state"),
  pincode: z.string().min(6, "Please enter a valid pincode"),
});

type AddressForm = z.infer<typeof addressSchema>;

const statusColors = {
  pending: "bg-yellow-500",
  packed: "bg-blue-500",
  dispatched: "bg-purple-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusIcons = {
  pending: Clock,
  packed: Package,
  dispatched: Package,
  shipped: Package,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function Profile() {
  const [, navigate] = useLocation();
  const authenticated = isAuthenticated();
  const user = getCurrentUser();
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: authenticated,
    queryFn: async () => {
      const response = await fetch("/api/orders", createAuthenticatedRequest("/api/orders"));
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    },
  });

  const { data: addresses = [], isLoading: addressesLoading } = useQuery<Address[]>({
    queryKey: ["/api/addresses"],
    enabled: authenticated,
    queryFn: async () => {
      const response = await fetch("/api/addresses", createAuthenticatedRequest("/api/addresses"));
      if (!response.ok) {
        throw new Error("Failed to fetch addresses");
      }
      return response.json();
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (addressData: AddressForm) => {
      const response = await fetch("/api/addresses", {
        ...createAuthenticatedRequest("/api/addresses"),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressData),
      });
      if (!response.ok) throw new Error("Failed to create address");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address added successfully!" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressForm }) => {
      const response = await fetch(`/api/addresses/${id}`, {
        ...createAuthenticatedRequest(`/api/addresses/${id}`),
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update address");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address updated successfully!" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/addresses/${id}`, {
        ...createAuthenticatedRequest(`/api/addresses/${id}`),
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete address");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Address deleted successfully!" });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/addresses/${id}/set-default`, {
        ...createAuthenticatedRequest(`/api/addresses/${id}/set-default`),
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to set default address");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      toast({ title: "Default address updated!" });
    },
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-login-required">
            Please login to view your profile
          </h1>
          <Button onClick={() => navigate("/login")} data-testid="button-login">
            Login
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "bg-gray-500";
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return Icon;
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-profile-title">
            My Account
          </h1>
          <p className="text-muted-foreground">
            Manage your profile and view order history
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" data-testid="tab-addresses">
              <MapPin className="mr-2 h-4 w-4" />
              Addresses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-foreground font-medium" data-testid="text-user-name">
                      {user?.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground font-medium" data-testid="text-user-email">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="mt-1">
                    <Badge variant={user?.role === "admin" ? "default" : "secondary"} data-testid="badge-user-role">
                      {user?.role === "admin" ? "Administrator" : "Customer"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2" data-testid="text-no-orders">
                      No orders yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start shopping to see your orders here
                    </p>
                    <Button onClick={() => navigate("/categories")} data-testid="button-start-shopping">
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <Card key={order.id} data-testid={`order-card-${order.id}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold" data-testid={`text-order-id-${order.id}`}>
                                  Order #{order.id.slice(0, 8).toUpperCase()}
                                </h3>
                                <p className="text-sm text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center mb-1">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(order.status)}`} />
                                  <StatusIcon className="h-4 w-4 mr-1" />
                                  <Badge variant="secondary" data-testid={`badge-order-status-${order.id}`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </Badge>
                                </div>
                                <p className="text-lg font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                                  ₹{parseFloat(order.total).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium">Items:</h4>
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm" data-testid={`order-item-${order.id}-${index}`}>
                                  <span>
                                    {item.name} {item.size && `(Size: ${item.size})`} {item.color && `(Color: ${item.color})`}
                                  </span>
                                  <span>
                                    {item.quantity}x ₹{parseFloat(item.price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-4 pt-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                <p><strong>Shipping Address:</strong></p>
                                <p data-testid={`text-shipping-address-${order.id}`}>
                                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                                  {order.shippingAddress.address}<br />
                                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Addresses</CardTitle>
                <AddressDialog
                  onSubmit={(data) => createAddressMutation.mutate(data)}
                  isPending={createAddressMutation.isPending}
                  trigger={
                    <Button data-testid="button-add-address">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Address
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                {addressesLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first address to make checkout faster
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <Card key={address.id} className={`relative ${address.isDefault ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{address.name}</span>
                                {address.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
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
                            <div className="flex gap-2 ml-4">
                              {!address.isDefault && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDefaultAddressMutation.mutate(address.id)}
                                  disabled={setDefaultAddressMutation.isPending}
                                  data-testid={`button-set-default-${address.id}`}
                                >
                                  Set Default
                                </Button>
                              )}
                              <AddressDialog
                                address={address}
                                onSubmit={(data) => updateAddressMutation.mutate({ id: address.id, data })}
                                isPending={updateAddressMutation.isPending}
                                trigger={
                                  <Button variant="outline" size="sm" data-testid={`button-edit-${address.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAddressMutation.mutate(address.id)}
                                disabled={deleteAddressMutation.isPending}
                                data-testid={`button-delete-${address.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AddressDialog({ 
  address, 
  onSubmit, 
  isPending, 
  trigger 
}: { 
  address?: Address; 
  onSubmit: (data: AddressForm) => void; 
  isPending: boolean; 
  trigger: React.ReactNode; 
}) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? {
      name: address.name,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    } : {
      name: "",
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const handleSubmit = (data: AddressForm) => {
    onSubmit(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Home, Office" {...field} data-testid="input-address-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} data-testid="input-full-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1</FormLabel>
                  <FormControl>
                    <Input placeholder="House/Flat number, Street name" {...field} data-testid="input-address-line1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Landmark, Area" {...field} data-testid="input-address-line2" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} data-testid="input-city" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} data-testid="input-state" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input placeholder="Pincode" {...field} data-testid="input-pincode" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isPending} className="flex-1" data-testid="button-save-address">
                {isPending ? "Saving..." : address ? "Update Address" : "Add Address"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
