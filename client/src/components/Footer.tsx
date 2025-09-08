import { Link } from "wouter";
import logoPath from "@assets/generated_images/Clean_KAMIO_logo_transparent_3545e88b.png";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <img src={logoPath} alt="KAMIO" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">KAMIO</h3>
                <p className="text-xs text-muted">Custom Lifestyle</p>
              </div>
            </div>
            <p className="text-muted text-sm mb-4">
              Creating custom apparel for sports teams, corporations, and individuals since 2020. Quality guaranteed.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.324-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.325C5.902 8.246 7.053 7.756 8.35 7.756s2.448.49 3.325 1.297c.807.876 1.297 2.027 1.297 3.324s-.49 2.448-1.297 3.325c-.876.807-2.027 1.297-3.325 1.297zm7.079 0c-1.297 0-2.448-.49-3.325-1.297-.807-.876-1.297-2.027-1.297-3.324s.49-2.448 1.297-3.325c.876-.807 2.027-1.297 3.325-1.297s2.448.49 3.324 1.297c.807.876 1.297 2.027 1.297 3.325s-.49 2.448-1.297 3.325c-.876.807-2.027 1.297-3.324 1.297z"/>
                </svg>
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-linkedin">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-home">Home</Link></li>
              <li><Link href="/categories" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-categories">Categories</Link></li>
              <li><Link href="/customize" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-customize">Customize</Link></li>
              <li><a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-about">About Us</a></li>
              <li><a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-contact">Contact</a></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/cricket" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-cricket">Cricket</Link></li>
              <li><Link href="/category/football" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-football">Football</Link></li>
              <li><Link href="/category/esports" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-esports">Esports</Link></li>
              <li><Link href="/category/corporate-uniforms" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-corporate">Corporate</Link></li>
              <li><Link href="/category/custom-flags" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-flags">Custom Flags</Link></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Info</h4>
            <div className="space-y-3 text-sm text-muted">
              <div>
                <p className="font-medium text-primary mb-1">Address:</p>
                <p>Shop No1,2,3, 2nd Floor, B-Block,</p>
                <p>Indus Market Rd, near HDFC ATM,</p>
                <p>Indus Towne, Ratanpur Sadak,</p>
                <p>Bhopal, Madhya Pradesh 462043</p>
              </div>
              <div>
                <p className="font-medium text-primary mb-1">Phone:</p>
                <a href="tel:+919575990599" className="hover:text-primary transition-colors" data-testid="link-footer-phone">
                  095759 90599
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-muted-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted text-sm mb-4 md:mb-0" data-testid="text-footer-copyright">
              © 2024 KAMIO Custom Lifestyle. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-privacy">Privacy Policy</a>
              <a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-terms">Terms of Service</a>
              <a href="#" className="text-muted hover:text-primary transition-colors" data-testid="link-footer-cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
