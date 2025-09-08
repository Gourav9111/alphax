
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Paintbrush2, Play, Truck, Shield, Users, Star, ArrowRight, Zap, Award, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Product, Category } from "@/../../shared/schema";

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const heroImages = [
    "/attached_assets/imgi_6_default_1757362105659.jpg",
    "/attached_assets/imgi_17_default_1757362105660.jpg",
    "/attached_assets/imgi_33_default_1757362105661.jpg",
    "/attached_assets/imgi_37_default_1757362105661.jpg",
    "/attached_assets/imgi_51_default_1757362105662.jpg"
  ];

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json() as Product[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json() as Category[];
    },
  });

  const featuredProducts = products?.slice(0, 8) || [];
  const customCategories = [
    { id: "1", name: "Cricket", slug: "cricket" },
    { id: "2", name: "Football", slug: "football" },
    { id: "3", name: "E-Sports", slug: "esports" },
    { id: "4", name: "Biker", slug: "biker" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Compact Mobile-Optimized */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 md:py-12 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-3">
                <Badge variant="outline" className="border-primary text-primary bg-primary/10 text-xs">
                  <Award className="mr-1 h-3 w-3" />
                  CENTRAL INDIA'S BIGGEST PRINTING SERVICE
                </Badge>
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                <span className="text-primary">CUSTOM</span>{" "}
                <span className="text-yellow-400">JERSEYS</span>
                <br className="hidden md:block" />
                <span className="text-white">& SPORTSWEAR</span>
              </h1>
              <p className="text-sm md:text-base text-gray-300 mb-6 max-w-lg mx-auto lg:mx-0">
                Professional jerseys for{" "}
                <span className="font-semibold text-white">Cricket</span>,{" "}
                <span className="font-semibold text-white">Football</span>,{" "}
                <span className="font-semibold text-white">E-Sports</span>,{" "}
                <span className="font-semibold text-white">Biker</span> & more
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/customize">
                  <Button size="default" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm md:text-base w-full sm:w-auto transform hover:scale-105 transition-all duration-300">
                    <Paintbrush2 className="mr-2 h-4 w-4" />
                    Start Customizing
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Content - Image Slider */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative max-w-sm mx-auto lg:max-w-full">
                <div className="aspect-square relative overflow-hidden rounded-lg shadow-2xl">
                  <img 
                    src={heroImages[currentSlide]} 
                    alt={`Custom KAMIO Jersey ${currentSlide + 1}`} 
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  
                  {/* Navigation Buttons */}
                  <button 
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300"
                    data-testid="button-prev-slide"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-300"
                    data-testid="button-next-slide"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  {/* Slide Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {heroImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentSlide === index ? 'bg-primary' : 'bg-white/50'
                        }`}
                        data-testid={`indicator-slide-${index}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Award, title: "CUSTOM MADE", desc: "Personalized designs" },
              { icon: Truck, title: "FREE SHIPPING", desc: "On all orders" },
              { icon: Users, title: "NO MINIMUM ORDER", desc: "Order as few as 1" },
              { icon: Paintbrush2, title: "FREE CUSTOMIZATION", desc: "No extra charges" }
            ].map((feature, index) => (
              <Card key={index} className="text-center border-none shadow-lg hover:shadow-xl transition-all duration-300 card-hover bg-white">
                <CardContent className="p-6">
                  <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Choose Your Sports Categories */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Choose Your Sports</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Professional jerseys for every sport. From cricket to esports, we've got you covered.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {customCategories.map((category, index) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Card className="group cursor-pointer border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                  <div className="aspect-[9/16] relative overflow-hidden">
                    <img 
                      src={`/api/placeholder/300/500`} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-primary/60 transition-all duration-300"></div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="font-bold text-sm md:text-lg">{category.name}</h3>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products with Animations */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our most popular custom jerseys with stunning designs and premium quality.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <Card className="group cursor-pointer border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden product-card-animation">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img 
                      src={product.image || `/api/placeholder/300/400`} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 product-zoom"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 text-white">
                        -{Math.round(((product.originalPrice || product.price) - product.price) / (product.originalPrice || product.price) * 100)}%
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                          Quick View
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                      )}
                      <span className="text-lg font-bold text-primary">₹{product.price}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/categories">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg group">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Custom Jersey?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: "Without Limits",
                desc: "Change colors, add logos, names, numbers, all at no extra cost. You decide whether to buy one of our designs or create your own special design."
              },
              {
                icon: Shield,
                title: "Quality",
                desc: "Selected technical fabrics and models designed to offer you the best experience. Each process is entrusted to the best experts in the sector."
              },
              {
                icon: Paintbrush2,
                title: "Design",
                desc: "With our team of designers you can realize the most unique and special ideas. Tell us your idea, we will realize it for you, with you."
              },
              {
                icon: Users,
                title: "Service",
                desc: "We support you in every step, from creating the design to delivering your personalized uniforms. Our team is at your service."
              },
              {
                icon: Clock,
                title: "Timing",
                desc: "We are always working to reduce waiting times to a minimum. Remember that every order is made from scratch just for you."
              },
              {
                icon: Star,
                title: "Made In India",
                desc: "The production, creation and design processes are all managed in India and controlled solely by us to offer you the best service."
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center border-none shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
                <CardContent className="p-8">
                  <feature.icon className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-xl mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Create Your Custom Jersey?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who trust us for their custom jersey needs. Start designing today!
          </p>
          <Link href="/customize">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-12 py-6 text-xl font-semibold transform hover:scale-105 transition-all duration-300">
              Start Customizing Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
