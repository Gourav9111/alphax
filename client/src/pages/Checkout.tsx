import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, createAuthenticatedRequest } from "@/lib/auth";
import { CreditCard, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(10, "Please enter your full address"),
  city: z.string().min(2, "Please enter your city"),
  state: z.string().min(2, "Please enter your state"),
  pincode: z.string().min(6, "Please enter a valid pincode"),
  country: z.string().default("India"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  product?: {
    id: string;
    name: string;
    price: string;
    images?: string[];
  };
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
    enabled: authenticated,
  });

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: CheckoutForm) => {
      const items = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.product?.price || "0",
        name: item.product?.name || "",
        // Include custom design data if it exists
        ...(item.customDesign && {
          customDesign: {
            scale: item.customDesign.scale,
            rotation: item.customDesign.rotation,
            x: item.customDesign.x,
            y: item.customDesign.y,
            image: item.customDesign.image,
            compositeImageUrl: item.customDesign.compositeImageUrl, // Include composite image
            color: item.customDesign.color,
            size: item.customDesign.size,
            price: item.customDesign.price,
            isFinished: item.customDesign.isFinished,
          }
        })
      }));

      const total = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.product?.price || "0") * item.quantity);
      }, 0);

      const shipping = total > 500 ? 0 : 50;
      const finalTotal = total + shipping;

      const options = createAuthenticatedRequest("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: finalTotal.toString(),
          items,
          shippingAddress: {
            firstName: orderData.firstName,
            lastName: orderData.lastName,
            email: orderData.email,
            phone: orderData.phone,
            address: orderData.address,
            city: orderData.city,
            state: orderData.state,
            pincode: orderData.pincode,
            country: orderData.country,
          },
          paymentStatus: "paid", // Simulated payment success
        }),
      });
      
      const response = await fetch("/api/orders", options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create order");
      }
      
      // Save address to user profile
      try {
        const authRequest = createAuthenticatedRequest("/api/addresses");
        const addressOptions = {
          ...authRequest,
          method: "POST",
          headers: { 
            ...authRequest.headers,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            name: "Home", // Default address name
            fullName: `${orderData.firstName} ${orderData.lastName}`,
            phone: orderData.phone,
            addressLine1: orderData.address,
            addressLine2: "",
            city: orderData.city,
            state: orderData.state,
            pincode: orderData.pincode,
            isDefault: false, // Don't set as default automatically
          }),
        };
        
        await fetch("/api/addresses", addressOptions);
        // Note: We don't throw on address save failure to avoid breaking the order flow
      } catch (addressError) {
        console.log("Failed to save address to profile:", addressError);
        // Continue with order completion even if address save fails
      }
      
      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/addresses"] });
      
      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id.slice(0, 8)} has been confirmed.`,
      });
      
      navigate("/profile");
    },
    onError: (error: Error) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CheckoutForm) => {
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      await createOrderMutation.mutateAsync(data);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-login-required">
            Please login to checkout
          </h1>
          <Button onClick={() => navigate("/login")} data-testid="button-login">
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-empty-cart">
            Your cart is empty
          </h1>
          <Button onClick={() => navigate("/categories")} data-testid="button-shop-now">
            Shop Now
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

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-checkout-title">
            Checkout
          </h1>
          <p className="text-muted-foreground">
            Complete your order details below
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isProcessing}
                                data-testid="input-first-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isProcessing}
                                data-testid="input-last-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                disabled={isProcessing}
                                data-testid="input-email"
                              />
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
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="tel"
                                disabled={isProcessing}
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              disabled={isProcessing}
                              data-testid="input-address"
                            />
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
                              <Input
                                {...field}
                                disabled={isProcessing}
                                data-testid="input-city"
                              />
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
                              <Input
                                {...field}
                                disabled={isProcessing}
                                data-testid="input-state"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isProcessing}
                                data-testid="input-pincode"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isProcessing}
                                data-testid="input-country"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isProcessing}
                      data-testid="button-place-order"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      {isProcessing ? "Processing..." : `Place Order (₹${total.toFixed(2)})`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3" data-testid={`order-item-${item.id}`}>
                    <img
                      src={item.product?.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                      alt={item.product?.name}
                      className="w-12 h-12 object-cover rounded"
                      data-testid={`img-order-item-${item.id}`}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium" data-testid={`text-order-item-name-${item.id}`}>
                        {item.product?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && " • "}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium" data-testid={`text-order-item-total-${item.id}`}>
                        ₹{(parseFloat(item.product?.price || "0") * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}

                <hr className="border-border" />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span data-testid="text-order-subtotal">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span data-testid="text-order-shipping">
                      {shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span data-testid="text-order-total">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Lock className="mr-2 h-4 w-4" />
                    Your payment information is secure and encrypted
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
