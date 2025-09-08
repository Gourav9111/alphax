import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main>{children}</main>
      <Footer />
      
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => navigate("/customize")}
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
          title="Quick Customize"
          data-testid="button-customize-float"
        >
          <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
