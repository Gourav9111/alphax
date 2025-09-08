import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
  size?: "large" | "small";
}

export default function CategoryCard({ category, size = "large" }: CategoryCardProps) {
  const isLarge = size === "large";
  
  return (
    <Link href={`/category/${category.slug}`}>
      <Card className="category-card rounded-xl card-hover cursor-pointer group" data-testid={`card-category-${category.slug}`}>
        <CardContent className={`${isLarge ? "p-6" : "p-5"} text-center`}>
          <img
            src={category.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
            alt={category.name}
            className={`${isLarge ? "w-32 h-48" : "w-28 h-40"} mx-auto mb-${isLarge ? "4" : "3"} rounded-xl object-cover product-zoom`}
            style={{ aspectRatio: '9/16' }}
            data-testid={`img-category-${category.slug}`}
          />
          <h3 className={`${isLarge ? "font-semibold" : "font-medium"} text-foreground group-hover:text-primary transition-colors`} data-testid={`text-category-name-${category.slug}`}>
            {category.name}
          </h3>
          <p className={`${isLarge ? "text-sm" : "text-xs"} text-muted-foreground mt-1`} data-testid={`text-category-description-${category.slug}`}>
            {category.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
