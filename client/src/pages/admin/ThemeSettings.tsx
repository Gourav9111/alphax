import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated, isAdmin } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Palette, Plus, Edit, Trash2, Eye, Check, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const themeSchema = z.object({
  name: z.string().min(2, "Theme name must be at least 2 characters"),
  primaryColor: z.string().regex(/^hsl\(/, "Must be a valid HSL color (e.g., hsl(142, 72%, 35%))"),
  secondaryColor: z.string().regex(/^hsl\(/, "Must be a valid HSL color"),
  accentColor: z.string().regex(/^hsl\(/, "Must be a valid HSL color"),
  backgroundColor: z.string().regex(/^hsl\(/, "Must be a valid HSL color"),
  textColor: z.string().regex(/^hsl\(/, "Must be a valid HSL color"),
  fontFamily: z.string().min(1, "Font family is required"),
  borderRadius: z.string().min(1, "Border radius is required"),
});

type ThemeForm = z.infer<typeof themeSchema>;

interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  isActive: boolean;
  createdAt: string;
}

const fontOptions = [
  { value: "Inter, system-ui, sans-serif", label: "Inter (Default)" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Helvetica, sans-serif", label: "Helvetica" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: "Lato, sans-serif", label: "Lato" },
  { value: "Open Sans, sans-serif", label: "Open Sans" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "monospace", label: "Monospace" },
];

const colorPresets = [
  { name: "KAMIO Green (Default)", colors: { primary: "hsl(142, 72%, 35%)", secondary: "hsl(210, 40%, 96%)", accent: "hsl(46, 96%, 50%)" } },
  { name: "Royal Blue", colors: { primary: "hsl(217, 91%, 60%)", secondary: "hsl(210, 40%, 96%)", accent: "hsl(45, 100%, 51%)" } },
  { name: "Crimson Red", colors: { primary: "hsl(348, 83%, 47%)", secondary: "hsl(210, 40%, 96%)", accent: "hsl(45, 100%, 51%)" } },
  { name: "Purple", colors: { primary: "hsl(271, 81%, 56%)", secondary: "hsl(210, 40%, 96%)", accent: "hsl(45, 100%, 51%)" } },
  { name: "Orange", colors: { primary: "hsl(25, 95%, 53%)", secondary: "hsl(210, 40%, 96%)", accent: "hsl(45, 100%, 51%)" } },
  { name: "Teal", colors: { primary: "hsl(173, 80%, 40%)", secondary: "hsl(210, 40%, 96%)", accent: "hsl(45, 100%, 51%)" } },
  { name: "Pink", colors: { primary: "hsl(330, 81%, 60%)", secondary: "hsl(210, 40%, 96%)", accent: "hsl(45, 100%, 51%)" } },
];

export default function AdminThemeSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authenticated = isAuthenticated();
  const isAdminUser = isAdmin();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  const { data: themes = [], isLoading } = useQuery<Theme[]>({
    queryKey: ["/api/admin/themes"],
    enabled: authenticated && isAdminUser,
  });

  const createForm = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      name: "",
      primaryColor: "hsl(142, 72%, 35%)",
      secondaryColor: "hsl(210, 40%, 96%)",
      accentColor: "hsl(46, 96%, 50%)",
      backgroundColor: "hsl(0, 0%, 100%)",
      textColor: "hsl(222.2, 84%, 4.9%)",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "0.75rem",
    },
  });

  const editForm = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      name: "",
      primaryColor: "",
      secondaryColor: "",
      accentColor: "",
      backgroundColor: "",
      textColor: "",
      fontFamily: "",
      borderRadius: "",
    },
  });

  const createThemeMutation = useMutation({
    mutationFn: async (data: ThemeForm) => {
      return await apiRequest("POST", "/api/admin/themes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      setIsCreateOpen(false);
      createForm.reset();
      toast({
        title: "Theme created successfully",
        description: "The new theme has been added to your collection.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create theme",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async (data: { id: string; theme: ThemeForm }) => {
      return await apiRequest("PATCH", `/api/admin/themes/${data.id}`, data.theme);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      setEditingTheme(null);
      editForm.reset();
      toast({
        title: "Theme updated successfully",
        description: "The theme has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update theme",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const activateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      return await apiRequest("POST", `/api/admin/themes/${themeId}/activate`);
    },
    onSuccess: (_, themeId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/theme"] });
      const theme = themes.find(t => t.id === themeId);
      toast({
        title: "Theme activated",
        description: `${theme?.name || 'Theme'} is now active on your site.`,
      });
      
      // Reload the page to apply the new theme
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to activate theme",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      return await apiRequest("DELETE", `/api/admin/themes/${themeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      toast({
        title: "Theme deleted",
        description: "The theme has been removed from your collection.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete theme",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
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
                ? "Please log in to access the theme settings."
                : "You don't have permission to access the theme settings. Please contact an administrator."
              }
            </p>
          </div>
          <div className="space-y-3">
            {!authenticated ? (
              <Button onClick={() => navigate("/admin/login")} className="w-full" data-testid="button-admin-login">
                Go to Admin Login
              </Button>
            ) : (
              <Button onClick={() => navigate("/admin")} variant="outline" className="w-full" data-testid="button-admin-dashboard">
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    editForm.reset({
      name: theme.name,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      fontFamily: theme.fontFamily,
      borderRadius: theme.borderRadius,
    });
  };

  const applyColorPreset = (preset: typeof colorPresets[0], form: any) => {
    form.setValue("primaryColor", preset.colors.primary);
    form.setValue("secondaryColor", preset.colors.secondary);
    form.setValue("accentColor", preset.colors.accent);
  };

  const onCreateSubmit = (data: ThemeForm) => {
    createThemeMutation.mutate(data);
  };

  const onEditSubmit = (data: ThemeForm) => {
    if (editingTheme) {
      updateThemeMutation.mutate({ id: editingTheme.id, theme: data });
    }
  };

  const handleDelete = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme?.isActive) {
      toast({
        title: "Cannot delete active theme",
        description: "Please activate another theme before deleting this one.",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Are you sure you want to delete this theme? This action cannot be undone.")) {
      deleteThemeMutation.mutate(themeId);
    }
  };

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-theme-settings-title">
            Theme Settings
          </h1>
          <p className="text-muted-foreground">
            Customize your KAMIO store's appearance with colors and fonts
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Available Themes</h2>
            <Badge variant="secondary">{themes.length}</Badge>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-theme">
                <Plus className="h-4 w-4 mr-2" />
                Create Theme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Theme</DialogTitle>
              </DialogHeader>
              
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., My Custom Theme" {...field} data-testid="input-theme-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color Presets */}
                  <div className="space-y-2">
                    <FormLabel>Quick Color Presets</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {colorPresets.map((preset) => (
                        <Button
                          key={preset.name}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyColorPreset(preset, createForm)}
                          className="justify-start text-left"
                          data-testid={`button-preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: preset.colors.primary }}
                            />
                            {preset.name}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Color Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <Input placeholder="hsl(142, 72%, 35%)" {...field} data-testid="input-primary-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <FormControl>
                            <Input placeholder="hsl(210, 40%, 96%)" {...field} data-testid="input-secondary-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <FormControl>
                            <Input placeholder="hsl(46, 96%, 50%)" {...field} data-testid="input-accent-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="backgroundColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color</FormLabel>
                          <FormControl>
                            <Input placeholder="hsl(0, 0%, 100%)" {...field} data-testid="input-background-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="textColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Color</FormLabel>
                          <FormControl>
                            <Input placeholder="hsl(222.2, 84%, 4.9%)" {...field} data-testid="input-text-color" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="fontFamily"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Family</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-font-family">
                              <SelectValue placeholder="Select a font" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="borderRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Border Radius</FormLabel>
                        <FormControl>
                          <Input placeholder="0.75rem" {...field} data-testid="input-border-radius" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel-create">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createThemeMutation.isPending}
                      data-testid="button-submit-create-theme"
                    >
                      {createThemeMutation.isPending ? "Creating..." : "Create Theme"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Themes Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : themes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No themes created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom theme to customize your store's appearance.
              </p>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-theme">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Theme
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <Card key={theme.id} className={`${theme.isActive ? 'ring-2 ring-primary' : ''}`} data-testid={`card-theme-${theme.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-theme-name-${theme.id}`}>
                      {theme.name}
                      {theme.isActive && (
                        <Badge className="bg-green-500 hover:bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Color Preview */}
                  <div className="flex gap-2 mb-4">
                    <div 
                      className="w-8 h-8 rounded-full border shadow-sm"
                      style={{ backgroundColor: theme.primaryColor }}
                      title="Primary Color"
                    />
                    <div 
                      className="w-8 h-8 rounded-full border shadow-sm"
                      style={{ backgroundColor: theme.secondaryColor }}
                      title="Secondary Color"
                    />
                    <div 
                      className="w-8 h-8 rounded-full border shadow-sm"
                      style={{ backgroundColor: theme.accentColor }}
                      title="Accent Color"
                    />
                    <div 
                      className="w-8 h-8 rounded-full border shadow-sm"
                      style={{ backgroundColor: theme.backgroundColor }}
                      title="Background Color"
                    />
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p><strong>Font:</strong> {theme.fontFamily.split(',')[0]}</p>
                    <p><strong>Border Radius:</strong> {theme.borderRadius}</p>
                    <p><strong>Created:</strong> {new Date(theme.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-2">
                    {!theme.isActive && (
                      <Button
                        size="sm"
                        onClick={() => activateThemeMutation.mutate(theme.id)}
                        disabled={activateThemeMutation.isPending}
                        data-testid={`button-activate-${theme.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(theme)}
                      data-testid={`button-edit-${theme.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(theme.id)}
                      disabled={theme.isActive || deleteThemeMutation.isPending}
                      data-testid={`button-delete-${theme.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Theme Dialog */}
        <Dialog open={!!editingTheme} onOpenChange={(open) => !open && setEditingTheme(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Theme: {editingTheme?.name}</DialogTitle>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theme Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., My Custom Theme" {...field} data-testid="input-edit-theme-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color Presets */}
                <div className="space-y-2">
                  <FormLabel>Quick Color Presets</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {colorPresets.map((preset) => (
                      <Button
                        key={preset.name}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyColorPreset(preset, editForm)}
                        className="justify-start text-left"
                        data-testid={`button-edit-preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: preset.colors.primary }}
                          />
                          {preset.name}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Color Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <Input placeholder="hsl(142, 72%, 35%)" {...field} data-testid="input-edit-primary-color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <Input placeholder="hsl(210, 40%, 96%)" {...field} data-testid="input-edit-secondary-color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accent Color</FormLabel>
                        <FormControl>
                          <Input placeholder="hsl(46, 96%, 50%)" {...field} data-testid="input-edit-accent-color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="backgroundColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Background Color</FormLabel>
                        <FormControl>
                          <Input placeholder="hsl(0, 0%, 100%)" {...field} data-testid="input-edit-background-color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="textColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Color</FormLabel>
                        <FormControl>
                          <Input placeholder="hsl(222.2, 84%, 4.9%)" {...field} data-testid="input-edit-text-color" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="fontFamily"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Font Family</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-font-family">
                            <SelectValue placeholder="Select a font" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              {font.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="borderRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Border Radius</FormLabel>
                      <FormControl>
                        <Input placeholder="0.75rem" {...field} data-testid="input-edit-border-radius" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingTheme(null)} data-testid="button-cancel-edit">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateThemeMutation.isPending}
                    data-testid="button-submit-edit-theme"
                  >
                    {updateThemeMutation.isPending ? "Updating..." : "Update Theme"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}