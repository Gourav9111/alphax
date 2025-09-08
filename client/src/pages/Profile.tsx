import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAuthenticated, getCurrentUser, createAuthenticatedRequest } from "@/lib/auth";
import { useLocation } from "wouter";
import { User, Package, Clock, CheckCircle, XCircle } from "lucide-react";
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="mr-2 h-4 w-4" />
              Orders
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
        </Tabs>
      </div>
    </div>
  );
}
