"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
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
import { UserRole } from "@/db/schema";

export default function AuthNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isAdmin = session?.user?.role === UserRole.Admin;

  const navigationItems = [
    { name: "Home", href: "/", description: "Landing page with overview of our services" },
    { name: "Plans", href: "/menu", description: "Browse our healthy meal plans and options" },
    { name: "Testimonials", href: "/testimonials", description: "Read customer reviews and share your experience" },
    ...(
      session && !isAdmin
        ? [
            { name: "Dashboard", href: "/dashboard", description: "Your personalized dashboard" },
            { name: "Subscription", href: "/subscription", description: "Subscribe to our weekly meal plans" },
          ]
        : []
    ),
    ...(
      session && isAdmin
        ? [
            { name: "Admin Dashboard", href: "/admin/dashboard", description: "Admin dashboard" },
            { name: "Admin Panel", href: "/admin", description: "Admin management panel" }
          ]
        : []
    ),
    ...(
      !session
        ? [{ name: "Contact Us", href: "/contact", description: "Get in touch with our team" }]
        : []
    ),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🍽️</span>
          <span className="text-xl font-bold text-orange-600">SEA Culinary</span>
        </Link>
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <NavigationMenuTrigger
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-orange-600",
                    pathname === item.href
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

        <div className="hidden md:flex items-center space-x-2">
          {status === "loading" ? (
            <div className="text-gray-500">Loading...</div>
          ) : session ? (
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2"
                onClick={() => setIsProfileOpen((v) => !v)}
              >
                <span>Welcome, {session.user.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

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
                <span className="text-xl font-bold text-orange-600">SEA Culinary</span>
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
                    pathname === item.href
                      ? "bg-orange-50 text-orange-600"
                      : "hover:bg-gray-50"
                  )}
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </Link>
              ))}
              {status === "loading" ? (
                <div className="text-gray-500">Loading...</div>
              ) : session ? (
                <div className="border-t border-gray-200 pt-4">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Signed in as {session.user.name}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="w-full mt-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white mt-2">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}