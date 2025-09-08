import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, createAuthenticatedRequest } from "@/lib/auth";
import { useLocation } from "wouter";
import { Upload, RotateCcw, RotateCw, ShoppingCart } from "lucide-react";

interface DesignConfig {
  scale: number;
  rotation: number;
  x: number;
  y: number;
  image?: string;
}

export default function Customize() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  
  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("M");
  const [design, setDesign] = useState<DesignConfig>({
    scale: 100,
    rotation: 0,
    x: 0,
    y: 0,
  });

  const colors = [
    { name: "White", value: "white", color: "#FFFFFF" },
    { name: "Black", value: "black", color: "#000000" },
    { name: "Red", value: "red", color: "#E30613" },
    { name: "Blue", value: "blue", color: "#3B82F6" },
    { name: "Green", value: "green", color: "#10B981" },
  ];

  const sizes = ["XS", "S", "M", "L", "XL"];

  const basePrice = 400;
  const designPrice = Math.floor((design.scale - 50) * 2);
  const totalPrice = basePrice + Math.max(designPrice, 0);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!authenticated) {
        throw new Error("Please login to add custom design to cart");
      }
      
      const options = createAuthenticatedRequest("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: "custom-tshirt", // Special product ID for custom designs
          quantity: 1,
          size: selectedSize,
          color: selectedColor,
          customDesign: {
            ...design,
            color: selectedColor,
            size: selectedSize,
            price: totalPrice,
          },
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
        description: "Your custom t-shirt has been added to cart.",
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setDesign(prev => ({
          ...prev,
          image: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotateLeft = () => {
    setDesign(prev => ({
      ...prev,
      rotation: prev.rotation - 15,
    }));
  };

  const handleRotateRight = () => {
    setDesign(prev => ({
      ...prev,
      rotation: prev.rotation + 15,
    }));
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-customize-title">
            3D T-Shirt Customizer
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-customize-description">
            Design your perfect t-shirt with our interactive 3D preview. Upload your logo, adjust positioning, and see your creation come to life.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 3D Preview */}
            <div className="relative">
              <Card className="shadow-lg">
                <CardContent className="p-8">
                  <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* T-shirt mockup */}
                    <div 
                      className="w-full h-full flex items-center justify-center relative"
                      style={{ backgroundColor: colors.find(c => c.value === selectedColor)?.color }}
                    >
                      {/* T-shirt base image */}
                      <img
                        src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"
                        alt="T-shirt preview"
                        className="w-full h-full object-cover rounded-xl opacity-80"
                        style={{ mixBlendMode: selectedColor === 'white' ? 'multiply' : 'overlay' }}
                        data-testid="img-tshirt-preview"
                      />
                      
                      {/* Design Overlay Area */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className={`w-32 h-32 border-2 border-primary/50 border-dashed rounded-lg flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all ${
                            design.image ? 'border-solid border-primary' : ''
                          }`}
                          style={{
                            transform: `translate(${design.x}px, ${design.y}px) scale(${design.scale / 100}) rotate(${design.rotation}deg)`,
                          }}
                          data-testid="design-preview-area"
                        >
                          {design.image ? (
                            <img
                              src={design.image}
                              alt="Custom design"
                              className="w-full h-full object-contain"
                              data-testid="img-custom-design"
                            />
                          ) : (
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-primary mb-2 mx-auto" />
                              <p className="text-xs text-muted-foreground">Drop logo here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 3D Controls */}
                  <div className="flex justify-center mt-6 space-x-4">
                    <Button
                      variant="outline"
                      onClick={handleRotateLeft}
                      data-testid="button-rotate-left"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Rotate Left
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRotateRight}
                      data-testid="button-rotate-right"
                    >
                      <RotateCw className="mr-2 h-4 w-4" />
                      Rotate Right
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Customization Panel */}
            <div className="space-y-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Your Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="design-upload"
                      data-testid="input-file-upload"
                    />
                    <label htmlFor="design-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-muted-foreground mb-3 mx-auto" />
                      <p className="text-muted-foreground mb-2">Drag & drop your image or</p>
                      <Button variant="link" className="text-primary hover:underline p-0" data-testid="button-browse-files">
                        Browse Files
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Supports PNG, JPG, SVG (Max 10MB)
                      </p>
                    </label>
                  </div>
                </CardContent>
              </Card>
              
              {/* T-shirt Options */}
              <Card>
                <CardHeader>
                  <CardTitle>T-shirt Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <div className="flex space-x-2">
                      {colors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color.value)}
                          className={`w-10 h-10 rounded-full border-2 transition-colors ${
                            selectedColor === color.value ? 'border-primary' : 'border-border'
                          }`}
                          style={{ backgroundColor: color.color }}
                          title={color.name}
                          data-testid={`button-color-${color.value}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Size Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Size</label>
                    <div className="grid grid-cols-5 gap-2">
                      {sizes.map((size) => (
                        <Button
                          key={size}
                          variant={selectedSize === size ? "default" : "outline"}
                          onClick={() => setSelectedSize(size)}
                          data-testid={`button-size-${size}`}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Design Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Design Position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Scale: {design.scale}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={design.scale}
                      onChange={(e) => setDesign(prev => ({ ...prev, scale: parseInt(e.target.value) }))}
                      className="w-full"
                      data-testid="slider-scale"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rotation: {design.rotation}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={design.rotation}
                      onChange={(e) => setDesign(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                      className="w-full"
                      data-testid="slider-rotation"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        X Position: {design.x}
                      </label>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={design.x}
                        onChange={(e) => setDesign(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                        className="w-full"
                        data-testid="slider-x-position"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Y Position: {design.y}
                      </label>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={design.y}
                        onChange={(e) => setDesign(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                        className="w-full"
                        data-testid="slider-y-position"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Price & Add to Cart */}
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold">Total Price:</span>
                    <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
                      ₹{totalPrice}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    <p>• Base price: ₹{basePrice}</p>
                    <p>• Design area: ₹{Math.max(designPrice, 0)}</p>
                  </div>
                  <Button
                    onClick={() => addToCartMutation.mutate()}
                    disabled={addToCartMutation.isPending}
                    className="w-full"
                    size="lg"
                    data-testid="button-add-to-cart"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
