import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { isAuthenticated, getCurrentUser, logout, isAdmin } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, ShoppingCart, User, LogOut } from "lucide-react";
import logoPath from "@assets/kamio-logo-green.png";

export default function Header() {
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = getCurrentUser();
  const authenticated = isAuthenticated();

  // Fetch cart items count
  const { data: cartItems = [] } = useQuery({
    queryKey: ["/api/cart"],
    enabled: authenticated,
  });

  const cartItemCount = Array.isArray(cartItems) ? cartItems.length : 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      {/* Breaking News Strip */}
      <div className="bg-primary text-white py-2 overflow-hidden relative">
        <div className="animate-marquee whitespace-nowrap inline-block">
          <span className="text-sm font-medium mx-8">
            🔥 CENTRAL INDIA'S BIGGEST PRINTING SERVICE - FREE SHIPPING ON ALL ORDERS - CUSTOM JERSEYS STARTING ₹299 - BULK ORDERS GET EXTRA DISCOUNTS
          </span>
        </div>
      </div>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center" data-testid="link-home">
          <img src={logoPath} alt="KAMIO" className="w-16 h-16 md:w-20 md:h-20 object-contain filter drop-shadow-sm logo-pulse" />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="link-home-nav">
            Home
          </Link>
          <Link href="/categories" className="text-foreground hover:text-primary transition-colors" data-testid="link-categories">
            Categories
          </Link>
          <Link href="/customize" className="text-foreground hover:text-primary transition-colors" data-testid="link-customize">
            Customize
          </Link>
          {authenticated && isAdmin() && (
            <Link href="/admin" className="text-foreground hover:text-primary transition-colors" data-testid="link-admin">
              Admin
            </Link>
          )}
        </nav>
        
        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <Button variant="ghost" size="icon" data-testid="button-search">
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Cart */}
          {authenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/cart")}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs" data-testid="text-cart-count">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          )}
          
          {/* User Menu */}
          {authenticated ? (
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                data-testid="button-profile"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate("/login")} data-testid="button-login">
                Login
              </Button>
              <Button onClick={() => navigate("/signup")} data-testid="button-signup">
                Sign Up
              </Button>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader className="p-4">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Access all sections of KAMIO</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4">
                <nav className="space-y-4">
                  <Link
                    href="/"
                    className="block py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-home-mobile"
                  >
                    Home
                  </Link>
                  <Link
                    href="/categories"
                    className="block py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-categories-mobile"
                  >
                    Categories
                  </Link>
                  <Link
                    href="/customize"
                    className="block py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-customize-mobile"
                  >
                    Customize
                  </Link>
                  {authenticated && isAdmin() && (
                    <Link
                      href="/admin"
                      className="block py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-admin-mobile"
                    >
                      Admin
                    </Link>
                  )}
                  <hr className="border-border my-4" />
                  {authenticated ? (
                    <>
                      <Link
                        href="/profile"
                        className="block py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="link-profile-mobile"
                      >
                        <User className="inline mr-3 h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                        data-testid="button-logout-mobile"
                      >
                        <LogOut className="inline mr-3 h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="link-login-mobile"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block py-3 px-4 text-foreground hover:bg-muted hover:text-primary rounded-lg transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="link-signup-mobile"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
