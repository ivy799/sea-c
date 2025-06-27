// Komponen TestimonialCard
function TestimonialCard({ testimonial }: { testimonial: any }) {
  // Generate avatar based on user name if no avatar exists
  const getAvatarUrl = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('');
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=random&color=fff&bold=true`;
  };

  // Generate star rating display
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>★</span>
    ));
  };

  return (
    <div className="min-w-[400px] bg-gray-100 rounded-lg p-6 mx-4 shadow-sm">
      <div className="mb-4">
        <div className="text-4xl text-blue-600 mb-2">"</div>
        <p className="text-gray-800 text-base leading-relaxed">{testimonial.message}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={getAvatarUrl(testimonial.full_name)}
            alt={testimonial.full_name}
            className="w-12 h-12 rounded-full mr-4 object-cover"
          />
          <div>
            <div className="font-semibold text-gray-900">{testimonial.full_name}</div>
            <div className="text-sm text-gray-600">Verified Customer</div>
          </div>
        </div>
        <div className="flex text-sm">
          {renderStars(testimonial.rating)}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection({ testimonials = [] }: { testimonials?: any[] }) {
  // If no testimonials provided, return null or loading state
  if (!testimonials || testimonials.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Words of praise from others<br />
            about our presence.
          </h2>
          <p className="text-gray-600">No testimonials available at the moment.</p>
        </div>
      </section>
    );
  }

  // Split testimonials into two rows
  const midPoint = Math.ceil(testimonials.length / 2);
  const firstRow = testimonials.slice(0, midPoint);
  const secondRow = testimonials.slice(midPoint);

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Words of praise from others<br />
          about our presence.
        </h2>
      </div>
      
      {/* First row - scroll right */}
      <div className="relative mb-8">
        <div className="flex animate-marquee-right">
          {[...firstRow, ...firstRow].map((testimonial, index) => (
            <TestimonialCard key={`first-${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      {/* Second row - scroll left */}
      {secondRow.length > 0 && (
        <div className="relative">
          <div className="flex animate-marquee-left">
            {[...secondRow, ...secondRow].map((testimonial, index) => (
              <TestimonialCard key={`second-${testimonial.id}-${index}`} testimonial={testimonial} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}