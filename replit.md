# Overview

KAMIO is a full-stack mobile-first e-commerce platform specializing in custom apparel design. The platform allows users to browse product categories (Cricket, Football, Biker, Cyclist, Marathon, Esports, Custom Flags, Corporate Gifts, etc.), customize t-shirts with 3D previews, and manage orders through an admin dashboard. The application features a React frontend with Vite, Express.js backend, PostgreSQL database with Drizzle ORM, and implements JWT-based authentication.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with pages for home, categories, products, cart, checkout, profile, customize, and admin sections
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Tailwind CSS with shadcn/ui components for consistent design system
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Color Scheme**: Primary colors are #E30613 (red), #FFFFFF (white), and #F8F8F8 (off-white) for brand consistency

## Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API endpoints
- **Database Access**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: JWT-based authentication with bcryptjs for password hashing
- **File Storage**: Images stored in database (GridFS-like approach) rather than external URLs
- **Session Management**: Express sessions for maintaining user state
- **API Structure**: RESTful endpoints following `/api/*` pattern for auth, products, categories, cart, and orders

## Data Storage
- **Primary Database**: PostgreSQL accessed through Neon Database serverless platform
- **ORM**: Drizzle ORM with schema-first approach for type safety
- **Image Storage**: Database-based image storage system to avoid external URL dependencies
- **Schema Design**: Normalized tables for users, categories, products, cart items, orders, and custom designs
- **Migrations**: Drizzle Kit for database schema migrations and management

## Authentication & Authorization
- **Authentication Method**: JWT tokens with email/password credentials
- **Password Security**: bcryptjs for secure password hashing and comparison
- **Role-Based Access**: User and admin roles with protected admin routes
- **Token Storage**: Client-side localStorage for JWT token persistence
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database platform via `@neondatabase/serverless`
- **Connection Pooling**: Built-in connection pooling through Neon's serverless architecture

## UI Component Libraries
- **Radix UI**: Headless UI components for accessibility and consistent behavior across all interactive elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens and theming
- **Lucide React**: Icon library for consistent iconography throughout the application

## Development Tools
- **Vite**: Fast build tool with hot module replacement and optimized production builds
- **TypeScript**: Type safety across frontend, backend, and shared code
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins

## Authentication & Security
- **JWT**: JSON Web Tokens for stateless authentication
- **bcryptjs**: Password hashing and comparison for secure user credentials

## State Management & Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Runtime type validation for forms and API data

## Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Runtime Error Handling**: Development-time error overlay for debugging
- **Hot Reload**: Development server with instant updates during code changes