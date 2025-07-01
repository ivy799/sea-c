"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface TestimonialFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function TestimonialForm({ onSuccess, onClose }: TestimonialFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    message: "",
    rating: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validation
    if (!formData.message.trim()) {
      setError("Please enter your review message");
      setIsSubmitting(false);
      return;
    }

    if (formData.message.trim().length < 10) {
      setError("Review message must be at least 10 characters long");
      setIsSubmitting(false);
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      setError("Please select a rating between 1 and 5 stars");
      setIsSubmitting(false);
      return;
    }

    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf-token');
      const csrfData = await csrfResponse.json();
      
      if (!csrfData.csrfToken) {
        throw new Error('Unable to get security token');
      }

      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfData.csrfToken,
        },
        body: JSON.stringify({
          message: formData.message.trim(),
          rating: formData.rating
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ message: "", rating: 5 });
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
        }, 2000);
      } else {
        setError(result.error || 'Failed to submit testimonial');
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      setError('An error occurred while submitting your testimonial');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      return (
        <button
          key={i}
          type="button"
          onClick={() => handleRatingChange(starNumber)}
          className={`text-3xl transition-colors duration-200 hover:scale-110 transform ${
            starNumber <= formData.rating
              ? 'text-yellow-400 hover:text-yellow-500'
              : 'text-gray-300 hover:text-yellow-300'
          }`}
          disabled={isSubmitting}
        >
          ⭐
        </button>
      );
    });
  };

  if (!session) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
          <p className="text-gray-600 mb-4">Please log in to submit a testimonial.</p>
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-600 mb-2">Thank You!</h3>
          <p className="text-gray-600">Your testimonial has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Share Your Experience</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={session.user?.name || ""}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex gap-1 mb-2">
            {renderStars()}
          </div>
          <p className="text-xs text-gray-500">
            {formData.rating} out of 5 stars
          </p>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Your Review
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleInputChange}
            placeholder="Tell us about your experience with our meal service..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.message.length}/500 characters (minimum 10)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </span>
            ) : (
              "Submit Review"
            )}
          </Button>
          
          {onClose && (
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
