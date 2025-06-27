"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigationItems = [
  { 
    name: "Home", 
    href: "/", 
    description: "Landing page with overview of our services"
  },
  { 
    name: "Menu", 
    href: "/menu", 
    description: "Browse our healthy meal plans and options"
  },
  { 
    name: "Subscription", 
    href: "/subscription", 
    description: "Subscribe to our weekly meal plans"
  },
  { 
    name: "Contact Us", 
    href: "/contact", 
    description: "Get in touch with our team"
  },
];

function NavbarComponent() {
  const [currentPath, setCurrentPath] = useState("/");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🍽️</span>
          <span className="text-xl font-bold text-orange-600">SEA Catering</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <NavigationMenuTrigger 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-orange-600",
                    currentPath === item.href 
                      ? "text-orange-600 bg-orange-50" 
                      : "text-gray-700"
                  )}
                >
                  {item.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[400px] p-4">
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        onClick={() => setCurrentPath(item.href)}
                      >
                        <div className="text-sm font-medium leading-none">{item.name}</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop CTA Button */}
        <Button className="hidden md:flex bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
          Order Now
        </Button>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-2">
                <span className="text-2xl">🍽️</span>
                <span className="text-xl font-bold text-orange-600">SEA Catering</span>
              </SheetTitle>
              <SheetDescription>
                Healthy meals delivered to your doorstep
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 py-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col space-y-1 p-2 rounded-md transition-colors",
                    currentPath === item.href 
                      ? "bg-orange-50 text-orange-600" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => setCurrentPath(item.href)}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </Link>
              ))}
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white mt-4">
                Order Now
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <NavbarComponent />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/90 to-red-600/90"></div>
        <div className="relative container mx-auto px-4 py-20 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            🍽️ SEA Catering
          </h1>
          <p className="text-xl md:text-2xl mb-8 font-medium">
            Healthy Meals, Anytime, Anywhere
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
              🛒 Pesan Sekarang
            </Button>
            <Button variant="outline" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-2 border-white/50 text-white font-bold py-4 px-8 rounded-full transition-all duration-300">
              📋 Lihat Menu
            </Button>
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
            <Button className="mt-6 bg-white text-orange-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
              💬 Chat WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
