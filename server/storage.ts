import { type User, type InsertUser, type Category, type InsertCategory, type Product, type InsertProduct, type CartItem, type InsertCartItem, type Order, type InsertOrder, type CustomDesign, type InsertCustomDesign } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Products
  getProducts(categoryId?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Cart
  getCartItems(userId: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, updates: Partial<CartItem>): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;

  // Orders
  getOrders(userId?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Custom Designs
  getCustomDesigns(userId: string): Promise<CustomDesign[]>;
  createCustomDesign(design: InsertCustomDesign): Promise<CustomDesign>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private categories: Map<string, Category>;
  private products: Map<string, Product>;
  private cartItems: Map<string, CartItem>;
  private orders: Map<string, Order>;
  private customDesigns: Map<string, CustomDesign>;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.customDesigns = new Map();

    this.seedData();
  }

  private async seedData() {
    // Create admin user
    const adminId = randomUUID();
    const adminUser: User = {
      id: adminId,
      email: "admin@kamio.in",
      password: await bcrypt.hash("kamio9111", 10),
      name: "Admin User",
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(adminId, adminUser);

    // Seed categories
    const categories = [
      { name: "Cricket", slug: "cricket", isPrimary: true, image: "/attached_assets/cricket%20jersey_1757357415580.png" },
      { name: "Football", slug: "football", isPrimary: true, image: "/attached_assets/fotball%20jersey%20image_1757357415582.png" },
      { name: "E-Sports", slug: "esports", isPrimary: true, image: "/attached_assets/esports%20kamio_1757357415581.png" },
      { name: "Marathon", slug: "marathon", isPrimary: true, image: "/attached_assets/marathon%20jersey%20ksmio_1757357415582.png" },
      { name: "Cycling", slug: "cycling", isPrimary: true, image: "/attached_assets/cyclist_1757357415581.png" },
      { name: "Bikers", slug: "bikers", isPrimary: true, image: "/attached_assets/biker%20jersy%20kamio_1757357415580.jfif" },
      { name: "Custom Flags", slug: "custom-flags", isPrimary: false, image: "/attached_assets/KAMIO%20FLAGS_1757366547552.png" },
      { name: "Corporate Gifts", slug: "corporate-gifts", isPrimary: false, image: "/attached_assets/GIFT%20ITEM%20KAMIO_1757366547551.png" },
      { name: "Corporate Uniforms", slug: "corporate-uniforms", isPrimary: false, image: "/attached_assets/uniform%20kamio_1757366547552.png" },
      { name: "Stickers", slug: "stickers", isPrimary: false, image: "/attached_assets/STICKERS%20KAMIO_1757366547552.png" },
    ];

    for (const cat of categories) {
      const categoryId = randomUUID();
      const category: Category = {
        id: categoryId,
        ...cat,
        description: `High-quality ${cat.name.toLowerCase()} apparel`,
        createdAt: new Date(),
      };
      this.categories.set(categoryId, category);
    }

    // Seed some products
    const esportsCategory = Array.from(this.categories.values()).find(c => c.slug === "esports");
    const cricketCategory = Array.from(this.categories.values()).find(c => c.slug === "cricket");

    if (esportsCategory) {
      const product1Id = randomUUID();
      const product1: Product = {
        id: product1Id,
        name: "Gaming Pro Jersey",
        slug: "gaming-pro-jersey",
        description: "Custom esports jersey with premium fabric",
        price: "549",
        originalPrice: "699",
        categoryId: esportsCategory.id,
        images: ["https://pixabay.com/get/g4247551d5d483f87470f7cf6d7eafdb1c2c50f0cf15376cccaa5d84986fa0cd98c74287f34c70e75b4c89ba066ba6172b1054e830dd91e910df98dc4d7f1fdd4_1280.jpg"],
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Black", "White", "Red", "Blue"],
        inventory: 50,
        rating: "4.8",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(product1Id, product1);
    }

    if (cricketCategory) {
      const product2Id = randomUUID();
      const product2: Product = {
        id: product2Id,
        name: "Cricket Team Jersey",
        slug: "cricket-team-jersey",
        description: "Professional cricket uniform with custom printing",
        price: "649",
        originalPrice: "799",
        categoryId: cricketCategory.id,
        images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=600"],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        colors: ["White", "Blue", "Green"],
        inventory: 30,
        rating: "4.9",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(product2Id, product2);
    }

    // Add Biker products
    const bikerCategory = Array.from(this.categories.values()).find(c => c.slug === "bikers");

    if (bikerCategory) {
      // KAMIO Racing Jersey
      const bikerProduct1Id = randomUUID();
      const bikerProduct1: Product = {
        id: bikerProduct1Id,
        name: "KAMIO Racing Jersey",
        slug: "kamio-racing-jersey",
        description: "Premium cycling jersey with aerodynamic design and moisture-wicking fabric. Features the iconic KAMIO branding with red accents.",
        price: "899",
        originalPrice: "1199",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_6f331cbc_1757350633571.jpg"],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        colors: ["Black", "White", "Red"],
        inventory: 25,
        rating: "4.9",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct1Id, bikerProduct1);

      // KAMIO Protective Biker Suit
      const bikerProduct2Id = randomUUID();
      const bikerProduct2: Product = {
        id: bikerProduct2Id,
        name: "KAMIO Protective Biker Suit",
        slug: "kamio-protective-biker-suit",
        description: "Professional grade protective biker gear with CE-approved armor. Ultimate safety meets style with KAMIO's signature design.",
        price: "2899",
        originalPrice: "3499",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_9a18ab62_1757350633572.jpg"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Black", "Gray", "Red"],
        inventory: 15,
        rating: "4.8",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct2Id, bikerProduct2);

      // KAMIO Wings Sports Gear
      const bikerProduct3Id = randomUUID();
      const bikerProduct3: Product = {
        id: bikerProduct3Id,
        name: "KAMIO Wings Sports Gear",
        slug: "kamio-wings-sports-gear",
        description: "Elite motorsport apparel featuring the distinctive KAMIO wings logo. Perfect for track days and competitive racing.",
        price: "1599",
        originalPrice: "1999",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_24d14876_1757350633572.jpg"],
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Black", "Teal", "White"],
        inventory: 20,
        rating: "4.7",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct3Id, bikerProduct3);

      // KAMIO Winter Biker Jacket
      const bikerProduct4Id = randomUUID();
      const bikerProduct4: Product = {
        id: bikerProduct4Id,
        name: "KAMIO Winter Biker Jacket",
        slug: "kamio-winter-biker-jacket",
        description: "Insulated winter riding jacket with weather protection and reflective elements. Keep warm while staying visible on cold rides.",
        price: "1299",
        originalPrice: "1699",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_6853b79c_1757350633573.jpg"],
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Black", "Red", "White"],
        inventory: 18,
        rating: "4.6",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct4Id, bikerProduct4);

      // KAMIO Eagle Sports Jersey
      const bikerProduct5Id = randomUUID();
      const bikerProduct5: Product = {
        id: bikerProduct5Id,
        name: "KAMIO Eagle Sports Jersey",
        slug: "kamio-eagle-sports-jersey",
        description: "Bold sports jersey with striking eagle design and geometric patterns. Made from high-performance fabric for maximum comfort.",
        price: "749",
        originalPrice: "999",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_45376b86_1757350633573.jpg"],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        colors: ["Black", "White", "Gray"],
        inventory: 30,
        rating: "4.8",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct5Id, bikerProduct5);

      // KAMIO Pro Racing Suit
      const bikerProduct6Id = randomUUID();
      const bikerProduct6: Product = {
        id: bikerProduct6Id,
        name: "KAMIO Pro Racing Suit",
        slug: "kamio-pro-racing-suit",
        description: "Advanced racing suit with ergonomic design and superior protection. Features cutting-edge materials and championship-level performance.",
        price: "3299",
        originalPrice: "3999",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_b3af2892_1757350633574.jpg"],
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "Silver", "Red"],
        inventory: 12,
        rating: "4.9",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct6Id, bikerProduct6);

      // KAMIO Teal Racing Jersey
      const bikerProduct7Id = randomUUID();
      const bikerProduct7: Product = {
        id: bikerProduct7Id,
        name: "KAMIO Teal Racing Jersey",
        slug: "kamio-teal-racing-jersey",
        description: "Vibrant teal racing jersey with dynamic geometric patterns. Ultra-lightweight and breathable for peak performance.",
        price: "849",
        originalPrice: "1099",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_e566bdfc_1757350633574.jpg"],
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Teal", "Black", "White"],
        inventory: 22,
        rating: "4.7",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct7Id, bikerProduct7);

      // KAMIO Sport Performance Jersey
      const bikerProduct8Id = randomUUID();
      const bikerProduct8: Product = {
        id: bikerProduct8Id,
        name: "KAMIO Sport Performance Jersey",
        slug: "kamio-sport-performance-jersey",
        description: "Classic white performance jersey with bold black stripe design. Perfect for training sessions and competitive events.",
        price: "599",
        originalPrice: "799",
        categoryId: bikerCategory.id,
        images: ["/api/images/WhatsApp%20Image%202025-08-28%20at%2015.56.51_6ddb56be_1757350633571.jpg"],
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        colors: ["White", "Black", "Gray"],
        inventory: 35,
        rating: "4.5",
        isActive: true,
        createdAt: new Date(),
      };
      this.products.set(bikerProduct8Id, bikerProduct8);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(cat => cat.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      id,
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  // Product methods
  async getProducts(categoryId?: string): Promise<Product[]> {
    const products = Array.from(this.products.values());
    if (categoryId) {
      return products.filter(p => p.categoryId === categoryId && p.isActive);
    }
    return products.filter(p => p.isActive);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.slug === slug);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Cart methods
  async getCartItems(userId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    const cartItem: CartItem = {
      ...insertCartItem,
      id,
      createdAt: new Date(),
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: string, updates: Partial<CartItem>): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...updates };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: string): Promise<boolean> {
    const userItems = Array.from(this.cartItems.entries()).filter(([_, item]) => item.userId === userId);
    userItems.forEach(([id]) => this.cartItems.delete(id));
    return true;
  }

  // Order methods
  async getOrders(userId?: string): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    if (userId) {
      return orders.filter(order => order.userId === userId);
    }
    return orders;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Custom Design methods
  async getCustomDesigns(userId: string): Promise<CustomDesign[]> {
    return Array.from(this.customDesigns.values()).filter(design => design.userId === userId);
  }

  async createCustomDesign(insertDesign: InsertCustomDesign): Promise<CustomDesign> {
    const id = randomUUID();
    const design: CustomDesign = {
      ...insertDesign,
      id,
      createdAt: new Date(),
    };
    this.customDesigns.set(id, design);
    return design;
  }
}

export const storage = new MemStorage();