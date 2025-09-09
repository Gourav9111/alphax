import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { 
  users, 
  categories, 
  products, 
  cartItems, 
  orders, 
  customDesigns, 
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
  type InsertCustomDesign 
} from "../shared/mysql-schema";

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
  getCustomDesign(id: string): Promise<CustomDesign | undefined>;
  createCustomDesign(design: InsertCustomDesign): Promise<CustomDesign>;
}

// MySQL connection configuration
const connectionConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'kamio_db',
};

// Create MySQL connection pool
const pool = mysql.createPool(connectionConfig);

// Initialize Drizzle
const db = drizzle(pool);

export class MySQLDatabaseStorage implements IStorage {
  
  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      // Test connection
      const connection = await pool.getConnection();
      console.log("Connected to MySQL database");
      connection.release();
      
      // Seed initial data
      await this.seedData();
    } catch (error) {
      console.error("Failed to connect to MySQL:", error);
    }
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

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [result] = await db.insert(users).values({
      ...user,
      password: hashedPassword
    });
    return await this.getUser(result.insertId.toString()) as User;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.affectedRows > 0;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(desc(categories.isPrimary), categories.name);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category);
    return await db.select().from(categories).where(eq(categories.id, result.insertId.toString())).limit(1).then(r => r[0]);
  }

  // Products
  async getProducts(categoryId?: string): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));
    
    if (categoryId) {
      query = query.where(eq(products.categoryId, categoryId));
    }
    
    return await query.orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(product);
    return await this.getProduct(result.insertId.toString()) as Product;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined> {
    await db.update(products).set(product).where(eq(products.id, id));
    return await this.getProduct(id);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.affectedRows > 0;
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const [result] = await db.insert(cartItems).values(cartItem);
    return await db.select().from(cartItems).where(eq(cartItems.id, result.insertId.toString())).limit(1).then(r => r[0]);
  }

  async updateCartItem(id: string, updates: Partial<CartItem>): Promise<CartItem | undefined> {
    await db.update(cartItems).set(updates).where(eq(cartItems.id, id));
    const result = await db.select().from(cartItems).where(eq(cartItems.id, id)).limit(1);
    return result[0];
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.affectedRows > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.affectedRows >= 0;
  }

  // Orders
  async getOrders(userId?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (userId) {
      query = query.where(eq(orders.userId, userId));
    }
    
    return await query.orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values(order);
    return await this.getOrder(result.insertId.toString()) as Order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    return await this.getOrder(id);
  }

  // Custom Designs
  async getCustomDesigns(userId: string): Promise<CustomDesign[]> {
    return await db.select().from(customDesigns).where(eq(customDesigns.userId, userId));
  }

  async getCustomDesign(id: string): Promise<CustomDesign | undefined> {
    const result = await db.select().from(customDesigns).where(eq(customDesigns.id, id)).limit(1);
    return result[0];
  }

  async createCustomDesign(design: InsertCustomDesign): Promise<CustomDesign> {
    const [result] = await db.insert(customDesigns).values(design);
    return await this.getCustomDesign(result.insertId.toString()) as CustomDesign;
  }
}

const storage = new MySQLDatabaseStorage();
export default storage;