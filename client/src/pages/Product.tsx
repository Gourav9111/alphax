import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { isAuthenticated, createAuthenticatedRequest } from "@/lib/auth";
import { ShoppingCart, Heart, Star, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", params.id],
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!authenticated) {
        throw new Error("Please login to add items to cart");
      }
      
      // Only require size if product has sizes
      if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
        throw new Error("Please select a size");
      }
      
      // Only require color if product has colors
      if (product?.colors && product.colors.length > 0 && !selectedColor) {
        throw new Error("Please select a color");
      }
      
      const options = createAuthenticatedRequest("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?.id,
          quantity,
          size: selectedSize,
          color: selectedColor,
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
        description: `${product?.name} has been added to your cart.`,
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

  if (isLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="h-96 rounded-xl" />
              <div className="flex space-x-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="w-20 h-20 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-product-not-found">
            Product not found
          </h1>
          <Button onClick={() => navigate("/categories")} data-testid="button-back-to-categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const images = product.images && product.images.length > 0 
    ? product.images 
    : ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"];

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/categories")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="mb-4">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-contain bg-white rounded-xl border"
                data-testid="img-product-main"
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className={`w-20 h-20 object-contain bg-white rounded-lg cursor-pointer border-2 ${
                      selectedImage === index ? "border-primary" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedImage(index)}
                    data-testid={`img-product-thumb-${index}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-product-name">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="text-lg" data-testid="text-product-rating">
                    {product.rating || "4.5"}
                  </span>
                  <span className="text-muted-foreground ml-2">(24 reviews)</span>
                </div>
                
                {hasDiscount && (
                  <Badge className="bg-primary text-primary-foreground" data-testid="badge-sale">
                    Sale
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
                  ₹{product.price}
                </span>
                {hasDiscount && (
                  <span className="text-xl text-muted-foreground line-through" data-testid="text-product-original-price">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground text-base leading-relaxed" data-testid="text-product-description">
                {product.description}
              </p>
              
              <div className="mt-4 space-y-2">
                <h4 className="font-medium">Features:</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Premium quality fabric with moisture-wicking technology</li>
                  <li>Customizable design with team logos and player names</li>
                  <li>Professional stitching for durability</li>
                  <li>Available in multiple sizes and colors</li>
                  <li>Fast delivery within 7-10 business days</li>
                </ul>
              </div>
            </div>

            {/* Product Options */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Size Selection */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Size</label>
                      <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger data-testid="select-size">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.sizes.map((size) => (
                            <SelectItem key={size} value={size} data-testid={`option-size-${size}`}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Color Selection */}
                  {product.colors && product.colors.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <Select value={selectedColor} onValueChange={setSelectedColor}>
                        <SelectTrigger data-testid="select-color">
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.colors.map((color) => (
                            <SelectItem key={color} value={color} data-testid={`option-color-${color}`}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                      <SelectTrigger data-testid="select-quantity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(10)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()} data-testid={`option-quantity-${i + 1}`}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending || (!selectedSize && product.sizes?.length) || (!selectedColor && product.colors?.length)}
                className="flex-1"
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                data-testid="button-wishlist"
              >
                <Heart className="h-4 w-4" />
              </Button>
            </div>

            {/* Product Info */}
            <Card className="mt-8">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Product Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SKU:</span>
                    <span className="font-medium" data-testid="text-product-sku">{product.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Availability:</span>
                    <span className={product.inventory && product.inventory > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"} data-testid="text-product-availability">
                      {product.inventory && product.inventory > 0 ? `In Stock (${product.inventory} units)` : "Out of Stock"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium" data-testid="text-product-category">Custom Sports Apparel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material:</span>
                    <span className="font-medium">100% Polyester Dri-FIT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Care:</span>
                    <span className="font-medium">Machine Washable</span>
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
