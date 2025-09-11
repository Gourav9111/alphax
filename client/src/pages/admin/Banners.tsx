
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isAuthenticated, isAdmin, createAuthenticatedRequest } from "@/lib/auth";
import { useLocation } from "wouter";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  discountText?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function AdminBanners() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  const isAdminUser = isAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    buttonText: "Customize Your T-Shirt Now",
    buttonLink: "/customize",
    discountText: "",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["/api/admin/banners"],
    enabled: authenticated && isAdminUser,
    queryFn: async () => {
      const response = await fetch("/api/admin/banners", createAuthenticatedRequest("/api/admin/banners"));
      if (!response.ok) throw new Error("Failed to fetch banners");
      return response.json();
    },
  });

  const createBannerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/banners", {
        ...createAuthenticatedRequest("/api/admin/banners"),
        method: "POST",
        headers: {
          ...createAuthenticatedRequest("/api/admin/banners").headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Banner created successfully" });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/banners/${id}`, {
        ...createAuthenticatedRequest(`/api/admin/banners/${id}`),
        method: "PUT",
        headers: {
          ...createAuthenticatedRequest(`/api/admin/banners/${id}`).headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      setEditingBanner(null);
      resetForm();
      toast({ title: "Banner updated successfully" });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/banners/${id}`, {
        ...createAuthenticatedRequest(`/api/admin/banners/${id}`),
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({ title: "Banner deleted successfully" });
    },
  });

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await fetch('/api/upload', {
        ...createAuthenticatedRequest('/api/upload'),
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const result = await response.json();
      setFormData(prev => ({ ...prev, image: result.url }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      toast({ 
        title: "Upload failed", 
        description: "Failed to upload image. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      buttonText: "Customize Your T-Shirt Now",
      buttonLink: "/customize",
      discountText: "",
      isActive: true,
      startDate: "",
      endDate: "",
    });
    setImageFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createBannerMutation.mutate(formData);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      image: banner.image,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      discountText: banner.discountText || "",
      isActive: banner.isActive,
      startDate: banner.startDate?.split('T')[0] || "",
      endDate: banner.endDate?.split('T')[0] || "",
    });
  };

  if (!authenticated || !isAdminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/admin/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Banner Management</h1>
            <p className="text-gray-600">Manage promotional banners for your website</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Banner</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Navratri Special Sale"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="discountText">Discount Text (Optional)</Label>
                    <Input
                      id="discountText"
                      value={formData.discountText}
                      onChange={(e) => setFormData(prev => ({ ...prev, discountText: e.target.value }))}
                      placeholder="e.g., 50% OFF"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Celebrate Navratri with custom group t-shirts featuring your logo and names"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="image">Banner Image</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          handleImageUpload(file);
                        }
                      }}
                    />
                    {formData.image && (
                      <img src={formData.image} alt="Preview" className="w-32 h-20 object-cover rounded" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={formData.buttonText}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="buttonLink">Button Link</Label>
                    <Input
                      id="buttonLink"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonLink: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date (Optional)</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isUploading || createBannerMutation.isPending}>
                    {isUploading ? "Uploading..." : "Create Banner"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Banners List */}
        <div className="grid gap-6">
          {banners.map((banner: Banner) => (
            <Card key={banner.id}>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-4 gap-4 items-center">
                  <div className="md:col-span-1">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-24 object-cover rounded"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{banner.title}</h3>
                      <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {banner.discountText && (
                        <Badge variant="outline">{banner.discountText}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{banner.description}</p>
                    <div className="text-xs text-gray-500">
                      <p>Button: {banner.buttonText} → {banner.buttonLink}</p>
                      {banner.startDate && banner.endDate && (
                        <p>Duration: {new Date(banner.startDate).toLocaleDateString()} - {new Date(banner.endDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:col-span-1 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBannerMutation.mutate(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingBanner} onOpenChange={(open) => !open && setEditingBanner(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Banner</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-discountText">Discount Text (Optional)</Label>
                  <Input
                    id="edit-discountText"
                    value={formData.discountText}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountText: e.target.value }))}
                    placeholder="e.g., 50% OFF"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-image">Banner Image</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        handleImageUpload(file);
                      }
                    }}
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="w-32 h-20 object-cover rounded" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-buttonText">Button Text</Label>
                  <Input
                    id="edit-buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-buttonLink">Button Link</Label>
                  <Input
                    id="edit-buttonLink"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, buttonLink: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Start Date (Optional)</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isUploading || updateBannerMutation.isPending}>
                  {isUploading ? "Uploading..." : "Update Banner"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingBanner(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
