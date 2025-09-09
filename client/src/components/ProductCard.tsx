import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/lib/auth";
import { useLocation } from "wouter";
import { createAuthenticatedRequest } from "@/lib/auth";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const authenticated = isAuthenticated();
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || "M");

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!authenticated) {
        throw new Error("Please login to add items to cart");
      }
      
      const options = createAuthenticatedRequest("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          size: selectedSize,
          color: product.colors?.[0] || "Default",
        }),
      });
      
      const response = await fetch("/api/cart", options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add to cart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("login")) {
        navigate("/login");
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCartMutation.mutate();
  };

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);

  return (
    <Card className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all card-hover group cursor-pointer" data-testid={`card-product-${product.id}`}>
      <Link href={`/product/${product.id}`}>
        <div className="relative overflow-hidden rounded-t-xl">
          <img
            src={product.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=600"}
            alt={product.name}
            className="w-full h-64 object-contain bg-white product-zoom"
            data-testid={`img-product-${product.id}`}
          />
          <div className="absolute top-4 left-4">
            {hasDiscount && (
              <Badge className="bg-primary text-primary-foreground" data-testid="badge-discount">
                Sale
              </Badge>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <Button
              variant="secondary"
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implement wishlist functionality
              }}
              data-testid={`button-wishlist-${product.id}`}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
            {product.description}
          </p>
        </Link>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
              ₹{product.price}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through" data-testid={`text-product-original-price-${product.id}`}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span data-testid={`text-product-rating-${product.id}`}>{product.rating || "4.5"}</span>
          </div>
        </div>
        
        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-3">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Size:</label>
            <Select value={selectedSize} onValueChange={setSelectedSize} data-testid={`select-size-${product.id}`}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {product.sizes.map((size) => (
                  <SelectItem key={size} value={size} data-testid={`option-size-${size}-${product.id}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button
          onClick={handleAddToCart}
          disabled={addToCartMutation.isPending}
          className="w-full"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
