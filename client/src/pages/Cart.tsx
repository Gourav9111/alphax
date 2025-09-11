import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, createAuthenticatedRequest } from "@/lib/auth";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  customDesign?: any;
  product?: {
    id: string;
    name: string;
    price: string;
    images?: string[];
    description?: string;
  };
}

export default function Cart() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: authenticated,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const options = createAuthenticatedRequest(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      
      const response = await fetch(`/api/cart/${itemId}`, options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update quantity");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const options = createAuthenticatedRequest(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      
      const response = await fetch(`/api/cart/${itemId}`, options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to remove item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const options = createAuthenticatedRequest("/api/cart", {
        method: "DELETE",
      });
      
      const response = await fetch("/api/cart", options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to clear cart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-login-required">
            Please login to view your cart
          </h1>
          <Button onClick={() => navigate("/login")} data-testid="button-login">
            Login
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((total, item) => {
    return total + (parseFloat(item.product?.price || "0") * item.quantity);
  }, 0);

  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4" data-testid="text-empty-cart">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Add some amazing products to get started
          </p>
          <Button onClick={() => navigate("/categories")} data-testid="button-shop-now">
            Shop Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-cart-title">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground" data-testid="text-cart-count">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={item.customDesign?.image || item.product?.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          data-testid={`img-cart-item-${item.id}`}
                        />
                        {item.customDesign && (
                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full">
                            Custom
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1" data-testid={`text-cart-item-name-${item.id}`}>
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-cart-item-description-${item.id}`}>
                          {item.product?.description}
                        </p>
                        <div className="flex items-center space-x-2 mb-2">
                          {item.size && (
                            <Badge variant="secondary" data-testid={`badge-cart-item-size-${item.id}`}>
                              Size: {item.size}
                            </Badge>
                          )}
                          {item.color && (
                            <Badge variant="secondary" data-testid={`badge-cart-item-color-${item.id}`}>
                              Color: {item.color}
                            </Badge>
                          )}
                        </div>
                        <p className="text-lg font-bold text-primary" data-testid={`text-cart-item-price-${item.id}`}>
                          ₹{item.product?.price}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantityMutation.mutate({ 
                            itemId: item.id, 
                            quantity: Math.max(1, item.quantity - 1) 
                          })}
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="w-12 text-center font-medium" data-testid={`text-cart-item-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantityMutation.mutate({ 
                            itemId: item.id, 
                            quantity: item.quantity + 1 
                          })}
                          disabled={updateQuantityMutation.isPending}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        disabled={removeItemMutation.isPending}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => clearCartMutation.mutate()}
                disabled={clearCartMutation.isPending}
                data-testid="button-clear-cart"
              >
                Clear Cart
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/categories")}
                data-testid="button-continue-shopping"
              >
                Continue Shopping
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4" data-testid="text-order-summary">
                  Order Summary
                </h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span data-testid="text-subtotal">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span data-testid="text-shipping">
                      {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {subtotal < 500 && (
                    <p className="text-sm text-muted-foreground">
                      Add ₹{(500 - subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}
                  <hr className="border-border" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span data-testid="text-total">₹{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => navigate("/checkout")}
                  className="w-full"
                  size="lg"
                  data-testid="button-checkout"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
