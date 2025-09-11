import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, isAdmin, createAuthenticatedRequest } from "@/lib/auth";
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Banner } from "@shared/schema";

const bannerSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  image: z.union([
    z.string().url("Please enter a valid URL"),
    z.string().regex(/^\//, "Please enter a valid path starting with /")
  ], { message: "Please enter a valid image URL or path" }),
  buttonText: z.string().min(1, "Button text is required"),
  redirectUrl: z.union([
    z.string().url("Please enter a valid URL"),
    z.string().regex(/^\//, "Please enter a valid path starting with /")
  ], { message: "Please enter a valid redirect URL or path" }),
  priority: z.number().min(0, "Priority must be 0 or greater").max(100, "Priority must be 100 or less"),
  isActive: z.boolean(),
});

type BannerForm = z.infer<typeof bannerSchema>;

export default function AdminBanners() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  const isAdminUser = isAdmin();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: banners = [], isLoading: bannersLoading } = useQuery<Banner[]>({
    queryKey: ["/api/admin/banners"],
    enabled: authenticated && isAdminUser,
    queryFn: async () => {
      const response = await fetch("/api/admin/banners", createAuthenticatedRequest("/api/admin/banners"));
      if (!response.ok) throw new Error("Failed to fetch banners");
      return response.json();
    },
  });

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      description: "",
      image: "",
      buttonText: "",
      redirectUrl: "",
      priority: 1,
      isActive: true,
    },
  });

  const createBannerMutation = useMutation({
    mutationFn: async (bannerData: BannerForm) => {
      const response = await fetch("/api/admin/banners", createAuthenticatedRequest("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerData),
      }));
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create banner");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Banner created successfully" });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BannerForm }) => {
      const response = await fetch(`/api/admin/banners/${id}`, createAuthenticatedRequest(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }));
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update banner");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Banner updated successfully" });
      setEditingBanner(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/banners/${id}`, createAuthenticatedRequest(`/api/admin/banners/${id}`, {
        method: "DELETE",
      }));
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete banner");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Banner deleted successfully" });
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
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" data-testid="text-access-denied">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need admin privileges to access this page.</p>
          <Button onClick={() => navigate("/admin/login")} data-testid="button-login">
            Login as Admin
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (data: BannerForm) => {
    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner.id, data });
    } else {
      createBannerMutation.mutate(data);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setImagePreview(banner.image || "");
    form.reset({
      title: banner.title,
      description: banner.description,
      image: banner.image || "",
      buttonText: banner.buttonText,
      redirectUrl: banner.redirectUrl,
      priority: banner.priority || 1,
      isActive: banner.isActive || false,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      deleteBannerMutation.mutate(id);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', createAuthenticatedRequest('/api/upload', {
        method: 'POST',
        body: formData,
      }));

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      form.setValue('image', data.url);
      setImagePreview(data.url);
      
      toast({
        title: "Image uploaded successfully",
        description: "Your banner image has been uploaded.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditingBanner(null);
    setImagePreview("");
    form.reset();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-banner-management">Banner Management</h1>
          <p className="text-muted-foreground">Create and manage promotional banners for your website</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-banner">
              <Plus className="h-4 w-4 mr-2" />
              Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Edit Banner" : "Create New Banner"}</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Festival Sale - 50% Off!" data-testid="input-banner-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="buttonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Shop Now" data-testid="input-button-text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Celebrate this festive season with our exclusive collection..."
                          rows={3}
                          data-testid="input-banner-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload Section */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Image</FormLabel>
                      <div className="space-y-4">
                        {/* File Upload */}
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                          <div className="text-center">
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={uploadingImage}
                                onClick={() => document.getElementById('banner-image-upload')?.click()}
                                data-testid="button-upload-image"
                              >
                                {uploadingImage ? "Uploading..." : "Upload Image"}
                              </Button>
                              <span className="text-sm text-muted-foreground">or</span>
                              <span className="text-sm text-muted-foreground">enter URL below</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                          <input
                            id="banner-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                          />
                        </div>

                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Banner preview"
                              className="w-full h-40 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setImagePreview("");
                                form.setValue('image', "");
                              }}
                              data-testid="button-remove-image"
                            >
                              Remove
                            </Button>
                          </div>
                        )}

                        {/* URL Input as Alternative */}
                        <div>
                          <FormLabel className="text-sm">Or enter image URL</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://example.com/banner-image.jpg or /api/images/filename.jpg" 
                              data-testid="input-image-url"
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value && !imagePreview) {
                                  setImagePreview(e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="redirectUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redirect URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/sale" data-testid="input-redirect-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (0-100)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            max="100"
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-priority"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Show this banner on the website
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
                    data-testid="button-save-banner"
                  >
                    {createBannerMutation.isPending || updateBannerMutation.isPending ? "Saving..." : editingBanner ? "Update Banner" : "Create Banner"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDialog} data-testid="button-cancel">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {bannersLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-24 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No banners yet</h3>
                <p className="text-muted-foreground mb-4">Create your first promotional banner to get started.</p>
                <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-banner">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Banner
                </Button>
              </CardContent>
            </Card>
          ) : (
            banners.map((banner) => (
              <Card key={banner.id} data-testid={`card-banner-${banner.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={banner.image || ""} 
                        alt={banner.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><ImageIcon class="h-6 w-6 text-muted-foreground" /></div>';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1" data-testid={`text-banner-title-${banner.id}`}>
                            {banner.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {banner.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <Badge variant={banner.isActive ? "default" : "secondary"} data-testid={`badge-status-${banner.id}`}>
                              {banner.isActive ? (
                                <><Eye className="h-3 w-3 mr-1" /> Active</>
                              ) : (
                                <><EyeOff className="h-3 w-3 mr-1" /> Inactive</>
                              )}
                            </Badge>
                            <span className="text-muted-foreground">Priority: {banner.priority}</span>
                            <span className="text-muted-foreground">Button: "{banner.buttonText}"</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banner)}
                        data-testid={`button-edit-${banner.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(banner.id)}
                        disabled={deleteBannerMutation.isPending}
                        data-testid={`button-delete-${banner.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}