import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { 
  users, 
  categories, 
  products, 
  cartItems, 
  orders, 
  customDesigns,
  addresses,
  banners,
  type User, 
  type InsertUser, 
  type Category, 
  type InsertCategory, 
  type Product, 
  type InsertProduct, 
  type CartItem, 
  type InsertCartItem, 
  type Order, 
  type InsertOrder, 
  type CustomDesign, 
  type InsertCustomDesign,
  type Address,
  type InsertAddress,
  type Banner,
  type InsertBanner,
} from "@shared/schema";

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

  // Address methods
  getAddresses(userId: string): Promise<Address[]>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: string, address: Partial<Address>): Promise<Address | undefined>;
  deleteAddress(id: string): Promise<boolean>;
  setDefaultAddress(userId: string, addressId: string): Promise<boolean>;

  // Banner methods
  getBanners(): Promise<Banner[]>;
  getActiveBanners(): Promise<Banner[]>;
  getBanner(id: string): Promise<Banner | undefined>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: string, banner: Partial<Banner>): Promise<Banner | undefined>;
  deleteBanner(id: string): Promise<boolean>;
}

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedData();
  }

  private async seedData() {
    try {
      // Check if categories already exist
      const existingCategories = await db.select().from(categories).limit(1);
      if (existingCategories.length > 0) {
        console.log("Database already seeded");
        return;
      }

      console.log("Seeding database...");

      // Seed categories
      const categoryData = [
        { name: "Cricket", slug: "cricket", isPrimary: true, image: "/attached_assets/cricket%20jersey_1757357415580.png", description: "High-quality cricket apparel" },
        { name: "Football", slug: "football", isPrimary: true, image: "/attached_assets/fotball%20jersey%20image_1757357415582.png", description: "High-quality football apparel" },
        { name: "E-Sports", slug: "esports", isPrimary: true, image: "/attached_assets/esports%20kamio_1757357415581.png", description: "High-quality esports apparel" },
        { name: "Marathon", slug: "marathon", isPrimary: true, image: "/attached_assets/marathon%20jersey%20ksmio_1757357415582.png", description: "High-quality marathon apparel" },
        { name: "Cycling", slug: "cycling", isPrimary: true, image: "/attached_assets/cyclist_1757357415581.png", description: "High-quality cycling apparel" },
        { name: "Bikers", slug: "bikers", isPrimary: true, image: "/attached_assets/biker%20jersy%20kamio_1757357415580.jfif", description: "High-quality biker apparel" },
        { name: "Custom Flags", slug: "custom-flags", isPrimary: false, image: "/attached_assets/KAMIO%20FLAGS_1757366547552.png", description: "High-quality custom flags" },
        { name: "Corporate Gifts", slug: "corporate-gifts", isPrimary: false, image: "/attached_assets/GIFT%20ITEM%20KAMIO_1757366547551.png", description: "High-quality corporate gifts" },
        { name: "Corporate Uniforms", slug: "corporate-uniforms", isPrimary: false, image: "/attached_assets/uniform%20kamio_1757366547552.png", description: "High-quality corporate uniforms" },
        { name: "Stickers", slug: "stickers", isPrimary: false, image: "/attached_assets/STICKERS%20KAMIO_1757366547552.png", description: "High-quality stickers" },
      ];

      await db.insert(categories).values(categoryData);
      console.log("Categories seeded successfully");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
      role: userData.role || "user"
    }).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.isPrimary, categories.name);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return result[0];
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  // Product methods
  async getProducts(categoryId?: string): Promise<Product[]> {
    if (categoryId) {
      return await db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(desc(products.createdAt));
    }
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return result[0];
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(productData).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Cart methods
  async getCartItems(userId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId)).orderBy(desc(cartItems.createdAt));
  }

  async addToCart(cartItemData: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await db.select().from(cartItems)
      .where(eq(cartItems.userId, cartItemData.userId!))
      .where(eq(cartItems.productId, cartItemData.productId!))
      .where(eq(cartItems.size, cartItemData.size || ''))
      .where(eq(cartItems.color, cartItemData.color || ''))
      .limit(1);

    if (existingItem.length > 0) {
      // Update quantity
      const [updatedItem] = await db.update(cartItems)
        .set({ quantity: existingItem[0].quantity + (cartItemData.quantity || 1) })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    }

    const [cartItem] = await db.insert(cartItems).values(cartItemData).returning();
    return cartItem;
  }

  async updateCartItem(id: string, updates: Partial<CartItem>): Promise<CartItem | undefined> {
    const [cartItem] = await db.update(cartItems).set(updates).where(eq(cartItems.id, id)).returning();
    return cartItem;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.rowCount >= 0;
  }

  // Order methods
  async getOrders(userId?: string): Promise<Order[]> {
    if (userId) {
      return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    }
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return order;
  }

  // Custom design methods
  async getCustomDesigns(userId: string): Promise<CustomDesign[]> {
    return await db.select().from(customDesigns).where(eq(customDesigns.userId, userId)).orderBy(desc(customDesigns.createdAt));
  }

  async createCustomDesign(designData: InsertCustomDesign): Promise<CustomDesign> {
    const [design] = await db.insert(customDesigns).values(designData).returning();
    return design;
  }

  // Address methods
  async getAddresses(userId: string): Promise<Address[]> {
    return await db.select().from(addresses).where(eq(addresses.userId, userId)).orderBy(desc(addresses.createdAt));
  }

  async createAddress(addressData: InsertAddress): Promise<Address> {
    const [address] = await db.insert(addresses).values(addressData).returning();
    return address;
  }

  async updateAddress(id: string, addressData: Partial<Address>): Promise<Address | undefined> {
    const [address] = await db.update(addresses).set(addressData).where(eq(addresses.id, id)).returning();
    return address;
  }

  async deleteAddress(id: string): Promise<boolean> {
    const result = await db.delete(addresses).where(eq(addresses.id, id));
    return result.rowCount > 0;
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
    // First, unset all addresses as default for this user
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    
    // Then set the specified address as default
    const result = await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, addressId));
    return result.rowCount > 0;
  }

  // Banner methods
  async getBanners(): Promise<Banner[]> {
    return await db.select().from(banners).orderBy(desc(banners.priority), desc(banners.createdAt));
  }

  async getActiveBanners(): Promise<Banner[]> {
    const now = new Date();
    return await db.select().from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(desc(banners.priority), desc(banners.createdAt));
  }

  async getBanner(id: string): Promise<Banner | undefined> {
    const result = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
    return result[0];
  }

  async createBanner(bannerData: InsertBanner): Promise<Banner> {
    const [banner] = await db.insert(banners).values(bannerData).returning();
    return banner;
  }

  async updateBanner(id: string, bannerData: Partial<Banner>): Promise<Banner | undefined> {
    const [banner] = await db.update(banners)
      .set({ ...bannerData, updatedAt: new Date() })
      .where(eq(banners.id, id))
      .returning();
    return banner;
  }

  async deleteBanner(id: string): Promise<boolean> {
    const result = await db.delete(banners).where(eq(banners.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();