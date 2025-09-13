import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isAuthenticated, isAdmin, createAuthenticatedRequest } from "@/lib/auth";
import { useLocation } from "wouter";
import { Package, ShoppingCart, Users, TrendingUp, Clock, CheckCircle, Palette } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

interface Order {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  userId: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  inventory: number;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const authenticated = isAuthenticated();
  const isAdminUser = isAdmin();

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: authenticated && isAdminUser,
    queryFn: async () => {
      const response = await fetch("/api/admin/orders", createAuthenticatedRequest("/api/admin/orders"));
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: authenticated && isAdminUser,
  });

  if (!authenticated || !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-4" data-testid="text-access-denied">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-6">
              {!authenticated 
                ? "Please log in to access the admin dashboard."
                : "You don't have permission to access the admin dashboard. Please contact an administrator."
              }
            </p>
          </div>
          <div className="space-y-3">
            {!authenticated ? (
              <button
                onClick={() => navigate("/admin/login")}
                className="w-full bg-[#E30613] hover:bg-[#E30613]/90 text-white h-10 px-4 py-2 rounded-md font-medium transition-colors"
                data-testid="button-login-admin"
              >
                Go to Admin Login
              </button>
            ) : (
              <button
                onClick={() => navigate("/")}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md font-medium transition-colors"
                data-testid="button-home-admin"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stats: DashboardStats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalUsers: 0, // Would need a separate API endpoint for user count
    totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.total), 0),
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    completedOrders: orders.filter(order => order.status === 'delivered').length,
  };

  const recentOrders = orders.slice(0, 5);
  const lowStockProducts = products.filter(product => (product.inventory || 0) < 10);

  if (ordersLoading || productsLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your KAMIO store performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-products">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-products">
                    {stats.totalProducts}
                  </p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-orders">
                    {stats.totalOrders}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-revenue">
                    ₹{stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-orders">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-pending-orders">
                    {stats.pendingOrders}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Management Grid */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Management Dashboard</CardTitle>
              <p className="text-muted-foreground">Quick access to all management features</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Link href="/admin/orders">
                  <Button variant="default" className="w-full h-16 bg-[#E30613] hover:bg-[#E30613]/90 text-white flex flex-col gap-1" data-testid="link-manage-orders">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="text-sm">Orders</span>
                  </Button>
                </Link>
                <Link href="/admin/products">
                  <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="link-manage-products">
                    <Package className="h-5 w-5" />
                    <span className="text-sm">Products</span>
                  </Button>
                </Link>
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="link-manage-users">
                    <Users className="h-5 w-5" />
                    <span className="text-sm">Users</span>
                  </Button>
                </Link>
                <Link href="/admin/banners">
                  <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="link-manage-banners">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">Banners</span>
                  </Button>
                </Link>
                <Link href="/admin/themes">
                  <Button variant="outline" className="w-full h-16 flex flex-col gap-1" data-testid="link-manage-themes">
                    <Palette className="h-5 w-5" />
                    <span className="text-sm">Themes</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link href="/admin/orders">
                <Button variant="default" size="sm" className="bg-[#E30613] hover:bg-[#E30613]/90 text-white" data-testid="link-view-all-orders">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4" data-testid="text-no-orders">
                  No orders yet
                </p>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`recent-order-${order.id}`}
                    >
                      <div>
                        <p className="font-medium" data-testid={`text-order-id-${order.id}`}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`text-order-date-${order.id}`}>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                          ₹{parseFloat(order.total).toFixed(2)}
                        </p>
                        <Badge
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          data-testid={`badge-order-status-${order.id}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock Alert</CardTitle>
              <Link href="/admin/products">
                <Button variant="default" size="sm" className="bg-[#E30613] hover:bg-[#E30613]/90 text-white" data-testid="link-products-stock">
                  Manage Stock
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground" data-testid="text-no-low-stock">
                    All products are well stocked
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`low-stock-product-${product.id}`}
                    >
                      <div>
                        <p className="font-medium" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ₹{product.price}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="destructive"
                          data-testid={`badge-stock-${product.id}`}
                        >
                          {product.inventory || 0} left
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
