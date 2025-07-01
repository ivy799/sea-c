"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import TestimonialForm from "../components/testimonial-form";
import TestimonialModal from "../components/testimonial-modal";
import AuthNavbar from "@/components/auth-navbar";
import ProtectedRoute from "@/components/protected-route";

interface Testimonial {
  id: number;
  message: string;
  rating: number;
  full_name: string;
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");

  const fetchTestimonials = async (page: number = 1, reset: boolean = false) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/testimonials?page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        if (reset) {
          setTestimonials(data.testimonials);
        } else {
          setTestimonials(prev => [...prev, ...data.testimonials]);
        }
        setHasMore(data.pagination.hasMore);
        setCurrentPage(page);
      } else {
        setError(data.error || 'Failed to load testimonials');
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setError('Failed to load testimonials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials(1, true);
  }, []);

  const handleTestimonialSuccess = () => {
    // Refresh testimonials from the beginning
    fetchTestimonials(1, true);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchTestimonials(currentPage + 1, false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ⭐
      </span>
    ));
  };

  const getAvatarUrl = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('');
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=random&color=fff&bold=true`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <AuthNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12 pt-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Customer Testimonials
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Read what our customers say about their experience with SEA Catering's healthy meal plans
          </p>
          
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
          >
            ⭐ Share Your Experience
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => fetchTestimonials(1, true)}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Testimonials Grid */}
        {testimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={getAvatarUrl(testimonial.full_name)}
                    alt={testimonial.full_name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {testimonial.full_name}
                    </h3>
                    <div className="flex">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  "{testimonial.message}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Testimonials Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to share your experience with SEA Catering!
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-full"
              >
                Write First Review
              </Button>
            </div>
          )
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading testimonials...</p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && testimonials.length > 0 && !isLoading && (
          <div className="text-center">
            <Button
              onClick={loadMore}
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              Load More Reviews
            </Button>
          </div>
        )}
      </div>

      {/* Testimonial Modal */}
      <TestimonialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTestimonialSuccess}
      />
    </div>
  );
}
