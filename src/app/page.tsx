"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TestimonialCarousel from "./components/testimonial-carousel";
import TestimonialModal from "./components/testimonial-modal";
import AuthNavbar from "@/components/auth-navbar";
import { useSession } from "next-auth/react";

interface Testimonial {
  id: number;
  message: string;
  rating: number;
  full_name: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch testimonials
  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/testimonials?limit=6');
      const data = await response.json();
      if (data.success) {
        setTestimonials(data.testimonials);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleTestimonialSuccess = () => {
    // Refresh testimonials after successful submission
    fetchTestimonials();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <AuthNavbar />

      <section className="relative overflow-hidden">
        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-red-600/90" />
        {/* Decorative blurred circles */}
        <div className="absolute -top-16 -left-16 w-72 h-72 bg-yellow-300/40 rounded-full blur-3xl opacity-80 pointer-events-none z-0" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-400/30 rounded-full blur-3xl opacity-70 pointer-events-none z-0" />
        <div className="relative container mx-auto px-4 py-24 flex flex-col items-center text-center text-white z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-yellow-300 via-orange-300 to-orange-500 bg-clip-text text-transparent drop-shadow-lg mb-4 leading-[2]">
            🍽️ SEA Catering
          </h1>
          <p className="text-xl md:text-2xl mb-8 font-medium drop-shadow">
            Healthy Meals, Anytime, Anywhere
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/subscription" passHref>
              <Button className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">
                🛒 Pesan Sekarang
              </Button>
            </Link>
            <Link href="/menu" passHref>
              <Button
                variant="outline"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-2 border-white/60 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 text-lg"
              >
                📋 Lihat Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Layanan Kami</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              SEA Catering menyediakan layanan meal plan sehat yang dapat dikustomisasi dan diantar ke berbagai kota di Indonesia.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-orange-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Meal Plan Kustom</h3>
                <p className="text-gray-600">Disesuaikan dengan kebutuhan nutrisi dan preferensi Anda</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-blue-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
                  🚚
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Pengiriman Nasional</h3>
                <p className="text-gray-600">Jangkauan pengiriman ke seluruh Indonesia dengan sistem terpercaya</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-t-4 border-green-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto">
                  📊
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Info Nutrisi Lengkap</h3>
                <p className="text-gray-600">Pantau asupan kalori dan nutrisi harian dengan detail</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Menu Populer</h2>
            <p className="text-lg text-gray-600">Pilihan favorit pelanggan kami</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Healthy Bowl", price: "Rp 45.000", emoji: "🥗", desc: "Sayuran segar dengan protein berkualitas" },
              { name: "Power Smoothie", price: "Rp 25.000", emoji: "🥤", desc: "Smoothie buah dan sayur untuk energi" },
              { name: "Grilled Salmon", price: "Rp 85.000", emoji: "🐟", desc: "Salmon panggang dengan quinoa dan sayuran" }
            ].map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="text-4xl mb-4 text-center">{item.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">{item.desc}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-orange-600">{item.price}</span>
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-300">
                      Pesan
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Updated to use Carousel */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Apa Kata Pelanggan Kami</h2>
            <p className="text-lg text-gray-600 mb-6">Kepuasan pelanggan adalah prioritas utama kami</p>
            
            {/* Write Review Button */}
            <Button
              onClick={() => setIsTestimonialModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg mb-8"
            >
              ⭐ Tulis Review Anda
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading testimonials...</p>
            </div>
          ) : (
            <TestimonialCarousel testimonials={testimonials} />
          )}
        </div>
      </section>

      {/* Testimonial Modal */}
      <TestimonialModal
        isOpen={isTestimonialModalOpen}
        onClose={() => setIsTestimonialModalOpen(false)}
        onSuccess={handleTestimonialSuccess}
      />

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">📞 Hubungi Kami</h2>
            <div className="space-y-4 text-white">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">👨‍💼</span>
                <div>
                  <p className="font-semibold">Manager</p>
                  <p className="text-xl font-bold">Brian</p>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-semibold">Phone</p>
                  <p className="text-xl font-bold">08123456789</p>
                </div>
              </div>
            </div>
            <Link href="/subscription">
              <Button className="mt-6 bg-white text-orange-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                💬 Chat WhatsApp
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}