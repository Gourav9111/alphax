import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, isAdmin, createAuthenticatedRequest } from "@/lib/auth";
import { Package, Clock, CheckCircle, XCircle, Truck, Download } from "lucide-react";
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
    customDesign?: {
      scale: number;
      rotation: number;
      x: number;
      y: number;
      image?: string;
      compositeImageUrl?: string;
      color: string;
      size: string;
      price: number;
    };
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
  userId: string;
}

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
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "packed", label: "Packed" },
  { value: "dispatched", label: "Dispatched" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminOrders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  const isAdminUser = isAdmin();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: authenticated && isAdminUser,
    queryFn: async () => {
      const response = await fetch("/api/admin/orders", createAuthenticatedRequest("/api/admin/orders"));
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const options = createAuthenticatedRequest(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      const response = await fetch(`/api/admin/orders/${orderId}/status`, options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!authenticated || !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-4" data-testid="text-access-denied">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-6">
              {!authenticated 
                ? "Please log in to access order management."
                : "You don't have permission to manage orders. Please contact an administrator."
              }
            </p>
          </div>
          <div className="space-y-3">
            {!authenticated ? (
              <Button
                onClick={() => navigate("/admin/login")}
                className="w-full bg-[#E30613] hover:bg-[#E30613]/90 text-white"
                data-testid="button-login-admin"
              >
                Go to Admin Login
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-home-admin"
              >
                Back to Home
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || "bg-gray-500";
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || Clock;
    return Icon;
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-orders-title">
            Order Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track all customer orders
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-orders">
              No orders yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Orders will appear here once customers start purchasing
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <Card key={order.id} data-testid={`order-card-${order.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`} />
                        <StatusIcon className="h-5 w-5" />
                        <CardTitle data-testid={`text-order-id-${order.id}`}>
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                          {formatDate(order.createdAt)}
                        </span>
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-40" data-testid={`select-order-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-semibold mb-3">Order Items</h4>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="p-4 bg-muted/30 rounded-lg border"
                              data-testid={`order-item-${order.id}-${index}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex space-x-3">
                                  {/* Custom Design Image with Download */}
                                  {(item.customDesign?.compositeImageUrl || item.customDesign?.image) && (
                                    <div className="flex-shrink-0 relative group">
                                      <img
                                        src={item.customDesign.compositeImageUrl || item.customDesign.image}
                                        alt={item.customDesign.compositeImageUrl ? "Complete T-shirt Design" : "Custom Design"}
                                        className="w-16 h-16 object-cover rounded-md border"
                                        data-testid={`img-custom-design-${order.id}-${index}`}
                                      />
                                      {/* Download Button */}
                                      {(item.customDesign.compositeImageUrl || item.customDesign.image) && (
                                        <a
                                          href={item.customDesign.compositeImageUrl || item.customDesign.image}
                                          download={`custom-design-${order.id}-${index}.png`}
                                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md"
                                          data-testid={`button-download-${order.id}-${index}`}
                                        >
                                          <Download className="h-4 w-4 text-white" />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium" data-testid={`text-item-name-${order.id}-${index}`}>
                                      {item.name}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {item.size && (
                                        <Badge variant="secondary">
                                          Size: {item.size}
                                        </Badge>
                                      )}
                                      {item.color && (
                                        <Badge variant="secondary">
                                          Color: {item.color}
                                        </Badge>
                                      )}
                                      {item.customDesign && (
                                        <Badge variant="outline" className="border-orange-500 text-orange-700">
                                          {item.customDesign.compositeImageUrl ? "Finished Design" : "Custom Design"}
                                        </Badge>
                                      )}
                                    </div>
                                    {/* Custom Design Details */}
                                    {item.customDesign && (
                                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                        <p>Scale: {item.customDesign.scale}% | Rotation: {item.customDesign.rotation}°</p>
                                        <p>Position: X:{item.customDesign.x}, Y:{item.customDesign.y}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium" data-testid={`text-item-total-${order.id}-${index}`}>
                                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity}x ₹{parseFloat(item.price).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Information */}
                      <div>
                        <h4 className="font-semibold mb-3">Shipping Information</h4>
                        <div className="space-y-2 text-sm" data-testid={`shipping-info-${order.id}`}>
                          <p>
                            <strong>Name:</strong> {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                          </p>
                          <p>
                            <strong>Email:</strong> {order.shippingAddress.email}
                          </p>
                          <p>
                            <strong>Phone:</strong> {order.shippingAddress.phone}
                          </p>
                          <p>
                            <strong>Address:</strong> {order.shippingAddress.address}
                          </p>
                          <p>
                            <strong>City:</strong> {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                          </p>
                          <p>
                            <strong>Country:</strong> {order.shippingAddress.country}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-4">
                        <Badge
                          variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                          data-testid={`badge-payment-status-${order.id}`}
                        >
                          Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(order.status)} text-white`}
                          data-testid={`badge-order-status-${order.id}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                          ₹{parseFloat(order.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
