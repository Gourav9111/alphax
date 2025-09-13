import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  categoryId: varchar("category_id").references(() => categories.id),
  images: text("images").array(),
  sizes: text("sizes").array(),
  colors: text("colors").array(),
  inventory: integer("inventory").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  productId: varchar("product_id").references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  size: text("size"),
  color: text("color"),
  customDesign: jsonb("custom_design"), // For custom t-shirt designs
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, packed, dispatched, shipped, delivered, cancelled
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // Array of order items
  shippingAddress: jsonb("shipping_address").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const customDesigns = pgTable("custom_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  design: jsonb("design").notNull(), // Design configuration
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(), // Address label like "Home", "Office"
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const banners = pgTable("banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // e.g., "Navratri Festival Sale"
  description: text("description").notNull(), // e.g., "Wear your group t-shirt with same logo and your own name"
  image: text("image"), // Banner image URL
  buttonText: text("button_text").notNull().default("Customize Your T-Shirt Now"),
  redirectUrl: text("redirect_url").notNull().default("/customize"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher priority banners show first
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const themeSettings = pgTable("theme_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Theme name like "Default", "Dark Mode", etc.
  primaryColor: text("primary_color").notNull().default("hsl(142 72% 35%)"), // Main brand color
  secondaryColor: text("secondary_color").notNull().default("hsl(210 40% 96%)"),
  accentColor: text("accent_color").notNull().default("hsl(46 96% 50%)"), // Accent color
  backgroundColor: text("background_color").notNull().default("hsl(0 0% 100%)"),
  textColor: text("text_color").notNull().default("hsl(222.2 84% 4.9%)"),
  fontFamily: text("font_family").notNull().default("Inter, system-ui, sans-serif"),
  borderRadius: text("border_radius").notNull().default("0.75rem"),
  isActive: boolean("is_active").default(false), // Only one theme can be active
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertCustomDesignSchema = createInsertSchema(customDesigns).omit({
  id: true,
  createdAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
  createdAt: true,
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertThemeSettingsSchema = createInsertSchema(themeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type CustomDesign = typeof customDesigns.$inferSelect;
export type InsertCustomDesign = z.infer<typeof insertCustomDesignSchema>;
export type Address = typeof addresses.$inferSelect;
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type ThemeSettings = typeof themeSettings.$inferSelect;
export type InsertThemeSettings = z.infer<typeof insertThemeSettingsSchema>;
