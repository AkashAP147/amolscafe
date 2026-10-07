import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';

const InstagramIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#161616] pt-16 pb-8 border-t border-[#2a2a2a] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand & Slogan */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="font-bold text-3xl tracking-tight text-white flex items-center gap-2">
              <span className="text-[#F58A1F]">Amol's</span> Cafe
            </Link>
            <p className="text-[#B5B5B5] text-lg font-medium">
              Good Food. Great Coffee. Better Moments.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a href="https://www.instagram.com/cafe_wala_amol?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="text-[#B5B5B5] hover:text-[#F58A1F] transition-colors">
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold text-xl mb-2">Quick Links</h3>
            <Link href="/" className="text-[#B5B5B5] hover:text-[#F58A1F] transition-colors w-fit">Home</Link>
            <Link href="/menu" className="text-[#B5B5B5] hover:text-[#F58A1F] transition-colors w-fit">Menu</Link>
            <Link href="/my-orders" className="text-[#B5B5B5] hover:text-[#F58A1F] transition-colors w-fit">Track Order</Link>
            <Link href="/about" className="text-[#B5B5B5] hover:text-[#F58A1F] transition-colors w-fit">About</Link>
            <Link href="/about" className="text-[#B5B5B5] hover:text-[#F58A1F] transition-colors w-fit">Contact</Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-white font-bold text-xl mb-2">Contact Us</h3>
            <div className="flex items-start gap-3 text-[#B5B5B5]">
              <Phone size={20} className="text-[#F58A1F] mt-1 shrink-0" />
              <div>
                <p className="font-medium text-white">Mr. Amol Mali</p>
                <p>+91 74111 21806</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-[#B5B5B5]">
              <MapPin size={20} className="text-[#F58A1F] mt-1 shrink-0" />
              <a href="https://maps.app.goo.gl/kseMdfmPmZVAPU768" target="_blank" rel="noopener noreferrer" className="hover:text-[#F58A1F] transition-colors">
                Nipani, Karnataka
              </a>
            </div>
            <div className="flex items-start gap-3 text-[#B5B5B5]">
              <Clock size={20} className="text-[#F58A1F] mt-1 shrink-0" />
              <div>
                <p className="text-white font-medium">Opening Hours</p>
                <p>Mon - Sun: 10:00 AM - 10:00 PM</p>
              </div>
            </div>
          </div>
          
        </div>
        
        <div className="pt-8 border-t border-[#2a2a2a] text-center text-[#B5B5B5] text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 Amol's Cafe. All rights reserved.</p>
          <p>Designed for premium experience.</p>
        </div>
      </div>
    </footer>
  );
}
