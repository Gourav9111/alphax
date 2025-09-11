import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, createAuthenticatedRequest } from "@/lib/auth";
import { useLocation } from "wouter";
import { Upload, RotateCcw, RotateCw, ShoppingCart, Check, Download, Edit3 } from "lucide-react";

interface DesignConfig {
  scale: number;
  rotation: number;
  x: number;
  y: number;
  image?: string;
  compositeImageUrl?: string; // URL of the complete t-shirt with design applied
  isFinished?: boolean; // Track if the design has been finalized
}

export default function Customize() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  
  const [selectedColor, setSelectedColor] = useState("white");
  const [selectedSize, setSelectedSize] = useState("M");
  const [viewMode, setViewMode] = useState<"front" | "back">("front");
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

  // T-shirt image mapping
  const getTShirtImage = (color: string, view: "front" | "back") => {
    const imageMap = {
      white: {
        front: "/generated_images/Fair_model_white_t-shirt_front_8b4dd000.png",
        back: "/generated_images/Fair_model_white_t-shirt_back_9b09833d.png"
      },
      red: {
        front: "/generated_images/Fair_model_red_t-shirt_front_90e3704d.png",
        back: "/generated_images/Fair_model_white_t-shirt_back_9b09833d.png"
      },
      blue: {
        front: "/generated_images/Fair_model_blue_t-shirt_front_797a4390.png",
        back: "/generated_images/Fair_model_white_t-shirt_back_9b09833d.png"
      },
      black: {
        front: "/generated_images/Fair_model_black_t-shirt_front_70633eb0.png",
        back: "/generated_images/Fair_model_white_t-shirt_back_9b09833d.png"
      },
      green: {
        front: "/generated_images/Fair_model_green_t-shirt_front_8ef122f7.png",
        back: "/generated_images/Fair_model_white_t-shirt_back_9b09833d.png"
      }
    };
    
    return imageMap[color as keyof typeof imageMap]?.[view] || imageMap.white[view];
  };

  const sizes = ["XS", "S", "M", "L", "XL"];

  const basePrice = 400;
  const designPrice = Math.floor((design.scale - 50) * 2);
  const totalPrice = basePrice + Math.max(designPrice, 0);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!authenticated) {
        throw new Error("Please login to add custom design to cart");
      }
      
      let uploadedImageUrl = null;
      
      // If there's a custom image, upload it first
      if (design.image) {
        try {
          // Convert base64 to blob
          const response = await fetch(design.image);
          const blob = await response.blob();
          
          // Create form data for upload
          const formData = new FormData();
          formData.append('image', blob, 'custom-design.png');
          
          // Upload the image
          const uploadOptions = createAuthenticatedRequest("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          const uploadResponse = await fetch("/api/upload", uploadOptions);
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            uploadedImageUrl = uploadResult.url;
          }
        } catch (error) {
          console.warn("Failed to upload custom image:", error);
        }
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
            scale: design.scale,
            rotation: design.rotation,
            x: design.x,
            y: design.y,
            image: uploadedImageUrl, // Use uploaded URL instead of base64
            compositeImageUrl: design.compositeImageUrl, // Include composite image
            color: selectedColor,
            size: selectedSize,
            price: totalPrice,
            isFinished: design.isFinished,
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

  const captureCompositeMutation = useMutation({
    mutationFn: async () => {
      if (!design.image) {
        throw new Error("Please upload a design first");
      }

      return new Promise<string>((resolve, reject) => {
        // Create a high-resolution canvas (2x for quality)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas not supported");

        // Set canvas size (high resolution)
        const canvasWidth = 800;
        const canvasHeight = 1000;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Load the base t-shirt image
        const baseImage = new Image();
        baseImage.crossOrigin = "anonymous";
        baseImage.onload = async () => {
          try {
            // Draw the base t-shirt
            ctx.drawImage(baseImage, 0, 0, canvasWidth, canvasHeight);

            // Load and draw the design if it exists
            if (design.image) {
              const designImage = new Image();
              designImage.crossOrigin = "anonymous";
              
              designImage.onload = async () => {
                // Calculate design position and size
                const designBaseWidth = 200; // Base design size
                const designBaseHeight = 200;
                const scaleFactor = design.scale / 100;
                const designWidth = designBaseWidth * scaleFactor;
                const designHeight = designBaseHeight * scaleFactor;
                
                // Calculate position (center + offset)
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2 - 50; // Slightly above center for chest area
                const designX = centerX - designWidth / 2 + (design.x * 2); // Scale x offset
                const designY = centerY - designHeight / 2 + (design.y * 2); // Scale y offset

                // Save context for rotation
                ctx.save();
                
                // Translate to design center for rotation
                ctx.translate(designX + designWidth / 2, designY + designHeight / 2);
                
                // Apply rotation
                ctx.rotate((design.rotation * Math.PI) / 180);
                
                // Draw the design (translate back to corner)
                ctx.drawImage(
                  designImage,
                  -designWidth / 2,
                  -designHeight / 2,
                  designWidth,
                  designHeight
                );
                
                // Restore context
                ctx.restore();

                // Convert canvas to blob and upload
                canvas.toBlob(async (blob) => {
                  if (!blob) {
                    reject(new Error("Failed to generate image"));
                    return;
                  }

                  try {
                    // Upload the composite image
                    const formData = new FormData();
                    formData.append('image', blob, 'custom-tshirt-composite.png');
                    
                    const uploadOptions = createAuthenticatedRequest("/api/upload", {
                      method: "POST",
                      body: formData,
                    });
                    
                    const uploadResponse = await fetch("/api/upload", uploadOptions);
                    if (uploadResponse.ok) {
                      const uploadResult = await uploadResponse.json();
                      resolve(uploadResult.url);
                    } else {
                      reject(new Error("Failed to upload composite image"));
                    }
                  } catch (error) {
                    reject(error);
                  }
                }, 'image/png', 0.95);
              };
              
              designImage.onerror = () => reject(new Error("Failed to load design image"));
              designImage.src = design.image;
            }
          } catch (error) {
            reject(error);
          }
        };
        
        baseImage.onerror = () => reject(new Error("Failed to load base t-shirt image"));
        baseImage.src = getTShirtImage(selectedColor, viewMode);
      });
    },
    onSuccess: (compositeImageUrl: string) => {
      setDesign(prev => ({
        ...prev,
        compositeImageUrl,
        isFinished: true,
      }));
      toast({
        title: "Design Finished!",
        description: "Your custom t-shirt design has been saved successfully.",
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB.",
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
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* T-shirt mockup */}
                    <div className="w-full h-full flex items-center justify-center relative">
                      {/* T-shirt base image */}
                      <img
                        src={getTShirtImage(selectedColor, viewMode)}
                        alt={`${selectedColor} t-shirt ${viewMode} view`}
                        className="w-full h-full object-cover rounded-xl"
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
                  
                  {/* View Controls */}
                  <div className="flex justify-center mt-6 space-x-2">
                    <Button
                      variant={viewMode === "front" ? "default" : "outline"}
                      onClick={() => setViewMode("front")}
                      className="px-6"
                      data-testid="button-front-view"
                    >
                      Front View
                    </Button>
                    <Button
                      variant={viewMode === "back" ? "default" : "outline"}
                      onClick={() => setViewMode("back")}
                      className="px-6"
                      data-testid="button-back-view"
                    >
                      Back View
                    </Button>
                  </div>
                  
                  {/* 3D Controls */}
                  <div className="flex justify-center mt-4 space-x-4">
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
              
              {/* Design Actions & Add to Cart */}
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  {/* Show finished design preview */}
                  {design.isFinished && design.compositeImageUrl && (
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2 text-green-700">
                        ✓ Design Finished
                      </div>
                      <img
                        src={design.compositeImageUrl}
                        alt="Finished Design"
                        className="w-full h-48 object-contain rounded-lg border bg-muted/10"
                        data-testid="img-finished-design"
                      />
                    </div>
                  )}
                  
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
                  
                  <div className="space-y-2">
                    {/* Finish/Edit Button */}
                    {design.image && !design.isFinished && (
                      <Button
                        onClick={() => captureCompositeMutation.mutate()}
                        disabled={captureCompositeMutation.isPending}
                        className="w-full"
                        size="lg"
                        variant="outline"
                        data-testid="button-finish-design"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {captureCompositeMutation.isPending ? "Finishing..." : "Finish Design"}
                      </Button>
                    )}
                    
                    {design.isFinished && (
                      <Button
                        onClick={() => setDesign(prev => ({ ...prev, isFinished: false, compositeImageUrl: undefined }))}
                        className="w-full"
                        size="lg"
                        variant="outline"
                        data-testid="button-edit-design"
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Design
                      </Button>
                    )}
                    
                    {/* Add to Cart Button */}
                    <Button
                      onClick={() => addToCartMutation.mutate()}
                      disabled={addToCartMutation.isPending || !design.image}
                      className="w-full"
                      size="lg"
                      data-testid="button-add-to-cart"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                    </Button>
                    
                    {!design.image && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Upload a design to add to cart
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
