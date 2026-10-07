import { Phone, MapPin, Mail, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white py-12 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Title */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">About <span className="text-[#F58A1F]">Amol's Cafe</span></h1>
          <p className="text-[#B5B5B5] text-lg max-w-2xl">
            Where passion for great food meets a warm, welcoming community. Come for the taste, stay for the memories.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          
          {/* Left Column: Image */}
          <div className="w-full lg:w-5/12 shrink-0">
            <div className="relative w-full aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden border border-[#2a2a2a] shadow-2xl">
              <img 
                src="/amolmali.webp" 
                alt="Amol Mali - Founder" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                <h3 className="text-2xl font-bold text-white">Mr. Amol Mali</h3>
                <p className="text-[#F58A1F] font-medium tracking-wide text-sm uppercase mt-1">Founder & Owner</p>
              </div>
            </div>
          </div>

          {/* Right Column: Story & Contact */}
          <div className="w-full lg:w-7/12 flex flex-col gap-10">
            
            {/* Story Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white border-b border-[#2a2a2a] pb-4">Our Story</h2>
              <p className="text-[#B5B5B5] leading-relaxed text-lg">
                Located right near the college campus, Amol's Cafe was built to be the perfect hangout spot for students and locals alike. We know exactly what you need between classes or after a long day: amazing food, a great vibe, and a place to chill with friends.
              </p>
              <p className="text-[#B5B5B5] leading-relaxed text-lg">
                Whether you're grabbing a quick bite before a lecture, studying with a coffee, or celebrating the end of exams with our signature handcrafted pizzas and sandwiches, we make sure every order hits the spot. Great taste, zero compromise, and always served fresh.
              </p>
            </div>

            {/* Contact Section */}
            <div>
              <h2 className="text-2xl font-bold text-white border-b border-[#2a2a2a] pb-4 mb-6">Get in Touch</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Phone */}
                <a 
                  href="tel:7411121806"
                  className="flex items-center gap-4 bg-[#161616] p-5 rounded-2xl border border-[#2a2a2a] hover:border-[#F58A1F] transition-all hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 bg-[#2a2a2a] group-hover:bg-[#F58A1F]/20 rounded-full flex items-center justify-center transition-colors shrink-0">
                    <Phone size={22} className="text-[#B5B5B5] group-hover:text-[#F58A1F]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#B5B5B5] uppercase font-bold tracking-wider mb-1">Call Us</p>
                    <p className="text-white font-bold group-hover:text-[#F58A1F] transition-colors">+91 74111 21806</p>
                  </div>
                </a>

                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/cafe_wala_amol"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 bg-[#161616] p-5 rounded-2xl border border-[#2a2a2a] hover:border-[#F58A1F] transition-all hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 bg-[#2a2a2a] group-hover:bg-gradient-to-tr group-hover:from-yellow-400 group-hover:via-red-500 group-hover:to-purple-500 rounded-full flex items-center justify-center transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#B5B5B5] group-hover:text-white">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[#B5B5B5] uppercase font-bold tracking-wider mb-1">Instagram</p>
                    <p className="text-white font-bold group-hover:text-white transition-colors">@cafe_wala_amol</p>
                  </div>
                </a>

                {/* Location */}
                <a 
                  href="https://maps.app.goo.gl/kseMdfmPmZVAPU768" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-4 bg-[#161616] p-5 rounded-2xl border border-[#2a2a2a] sm:col-span-2 hover:border-[#F58A1F] transition-all hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 bg-[#2a2a2a] group-hover:bg-[#F58A1F]/20 rounded-full flex items-center justify-center transition-colors shrink-0">
                    <MapPin size={22} className="text-[#B5B5B5] group-hover:text-[#F58A1F]" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs text-[#B5B5B5] uppercase font-bold tracking-wider mb-1">Visit Us</p>
                    <p className="text-white font-bold group-hover:text-[#F58A1F] transition-colors">Nipani, Karnataka</p>
                  </div>
                  <div className="shrink-0 bg-[#2a2a2a] p-2 rounded-xl text-[#B5B5B5] group-hover:bg-[#F58A1F] group-hover:text-white transition-colors">
                    <ChevronRight size={20} />
                  </div>
                </a>

              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-6">
              <Link 
                href="/menu" 
                className="inline-flex items-center justify-center bg-[#F58A1F] hover:bg-[#e07a1b] text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95"
              >
                View Our Menu
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
