import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import { storage } from "./storage.js";
import { insertUserSchema, insertProductSchema, insertCategorySchema, insertCartItemSchema, insertOrderSchema, insertBannerSchema } from "@shared/schema";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Ensure JWT_SECRET is available
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required for security in production');
  } else {
    // In development, generate a temporary secret with warnings
    console.warn('⚠️  WARNING: JWT_SECRET not set! Using temporary secret for development.');
    console.warn('⚠️  Set JWT_SECRET environment variable for production security!');
    console.warn('⚠️  Example: export JWT_SECRET="your-very-secure-secret-key-here"');
    process.env.JWT_SECRET = 'dev-temporary-secret-' + Math.random().toString(36);
  }
}

const JWT_SECRET = process.env.JWT_SECRET;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "..", "uploaded_images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to verify JWT token
function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Middleware to check admin role
function requireAdmin(req: Request, res: Response, next: Function) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
    } catch (error) {
      res.status(500).json({ message: "Login failed", error });
    }
  });

  // Image upload route
  app.post("/api/upload", authenticateToken, upload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const imageUrl = `/api/images/${encodeURIComponent(req.file.filename)}`;
      res.json({ url: imageUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ message: 'File upload failed', error });
    }
  });

  // Serve uploaded images - secured against path traversal
  app.get("/api/images/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const decodedFilename = decodeURIComponent(filename);
    
    // Prevent directory traversal attacks
    if (decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    const imagePath = path.join(__dirname, "..", "uploaded_images", decodedFilename);
    
    // Ensure the resolved path is within the upload directory
    const uploadDirPath = path.resolve(__dirname, "..", "uploaded_images");
    const resolvedImagePath = path.resolve(imagePath);
    
    if (!resolvedImagePath.startsWith(uploadDirPath)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }
    
    res.sendFile(resolvedImagePath);
  });

  // Serve attached assets - secured against path traversal
  app.get("/attached_assets/:filename", (req: Request, res: Response) => {
    const filename = req.params.filename;
    const decodedFilename = decodeURIComponent(filename);
    
    // Prevent directory traversal attacks
    if (decodedFilename.includes('..') || decodedFilename.includes('/') || decodedFilename.includes('\\')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    const imagePath = path.join(__dirname, "..", "attached_assets", decodedFilename);
    
    // Ensure the resolved path is within the assets directory
    const assetsDirPath = path.resolve(__dirname, "..", "attached_assets");
    const resolvedImagePath = path.resolve(imagePath);
    
    if (!resolvedImagePath.startsWith(assetsDirPath)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }
    
    res.sendFile(resolvedImagePath);
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories", error });
    }
  });

  app.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data", error });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category", error });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const products = await storage.getProducts(categoryId as string);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products", error });
    }
  });

  app.get("/api/categories/:categoryId/products", async (req, res) => {
    try {
      const products = await storage.getProducts(req.params.categoryId);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products", error });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product", error });
    }
  });

  app.post("/api/products", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data", error });
    }
  });

  app.put("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product", error });
    }
  });

  app.delete("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product", error });
    }
  });

  // Cart routes
  app.get("/api/cart", authenticateToken, async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.user.userId);

      // Fetch product details for each cart item
      const cartWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId!);
          return { ...item, product };
        })
      );

      res.json(cartWithProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart", error });
    }
  });

  app.post("/api/cart", authenticateToken, async (req, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.userId
      });

      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart item data", error });
    }
  });

  app.put("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const cartItem = await storage.updateCartItem(req.params.id, req.body);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Failed to update cart item", error });
    }
  });

  app.delete("/api/cart/:id", authenticateToken, async (req, res) => {
    try {
      const deleted = await storage.removeFromCart(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item", error });
    }
  });

  app.delete("/api/cart", authenticateToken, async (req, res) => {
    try {
      await storage.clearCart(req.user.userId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart", error });
    }
  });

  // Order routes
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orders = await storage.getOrders(req.user.userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders", error });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.userId
      });

      const order = await storage.createOrder(orderData);

      // Clear cart after successful order
      await storage.clearCart(req.user.userId);

      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data", error });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns this order or is admin
      if (order.userId !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order", error });
    }
  });

  // Admin routes
  app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders", error });
    }
  });

  app.patch("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order status", error });
    }
  });

  // Banner routes
  // Public route to get active banners for homepage
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getActiveBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banners", error });
    }
  });

  // Admin banner routes
  app.get("/api/admin/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const banners = await storage.getBanners();
      res.json(banners);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banners", error });
    }
  });

  app.get("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const banner = await storage.getBanner(req.params.id);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banner", error });
    }
  });

  app.post("/api/admin/banners", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBannerSchema.parse(req.body);
      const banner = await storage.createBanner(validatedData);
      res.status(201).json(banner);
    } catch (error) {
      res.status(400).json({ message: "Failed to create banner", error });
    }
  });

  app.put("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertBannerSchema.partial().parse(req.body);
      const banner = await storage.updateBanner(req.params.id, validatedData);
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json(banner);
    } catch (error) {
      res.status(400).json({ message: "Failed to update banner", error });
    }
  });

  app.delete("/api/admin/banners/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteBanner(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Banner not found" });
      }
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete banner", error });
    }
  });

  // User profile route
  app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't send password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile", error });
    }
  });

  // Debug endpoint to check users - SECURED
  app.get("/api/debug/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Endpoint not available in production' });
      }
      
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
  });

  // Create admin user - SECURED (admin-only endpoint)
  app.post("/api/create-admin", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Endpoint not available in production' });
      }
      
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
      }

      console.log("Creating admin user:", { email, name });

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log("User already exists:", email);
        return res.status(400).json({ message: "User already exists" });
      }

      const userData = { email, password, name, role: 'admin' as const };
      const user = await storage.createUser(userData);
      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

      console.log("Admin user created successfully:", { id: user.id, email: user.email, role: user.role });

      res.json({ 
        user: { id: user.id, email: user.email, name: user.name, role: user.role }, 
        token,
        message: "Admin user created successfully" 
      });
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(400).json({ message: "Failed to create admin user", error: error.message });
    }
  });

  // REMOVED: Force admin endpoint - CRITICAL SECURITY VULNERABILITY FIXED
  // This endpoint was extremely dangerous as it allowed anyone to create admin accounts
  // with hardcoded credentials. Use the secured /api/create-admin endpoint instead
  // (requires existing admin authentication)

  const httpServer = createServer(app);
  return httpServer;
}