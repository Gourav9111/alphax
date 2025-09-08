import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import { Category, Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Categories() {
  const params = useParams();
  const selectedSlug = params.slug;

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const selectedCategory = selectedSlug 
    ? categories.find(cat => cat.slug === selectedSlug)
    : null;

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: selectedCategory 
      ? ["/api/categories", selectedCategory.id, "products"]
      : ["/api/products"],
  });

  if (categoriesLoading) {
    return (
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-page-title">
            {selectedCategory ? selectedCategory.name : "All Categories"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-page-description">
            {selectedCategory 
              ? `Explore our ${selectedCategory.name.toLowerCase()} collection`
              : "Browse all our custom apparel categories"
            }
          </p>
        </div>

        {!selectedCategory && (
          <>
            {/* All Categories View */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold mb-8" data-testid="text-primary-categories">
                Primary Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {categories.filter(cat => cat.isPrimary).map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>

              <h2 className="text-2xl font-bold mb-8" data-testid="text-secondary-categories">
                More Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.filter(cat => !cat.isPrimary).map((category) => (
                  <CategoryCard key={category.id} category={category} size="small" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-8" data-testid="text-products-section">
            {selectedCategory ? `${selectedCategory.name} Products` : "All Products"}
          </h2>
          
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-64 rounded-xl" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg" data-testid="text-no-products">
                No products found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
