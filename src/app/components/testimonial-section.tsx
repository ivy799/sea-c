// Data dummy testimonials
const testimonials = [
  {
    id: 1,
    name: "Gabrielle Williams",
    position: "CEO and Co-founder of ABC Company",
    message: "Creative geniuses who listen, understand, and craft captivating visuals - an agency that truly understands our needs.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b789?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 2,
    name: "Samantha Johnson", 
    position: "CEO and Co-founder of ABC Company",
    message: "Exceeded our expectations with innovative designs that brought our vision to life - a truly remarkable creative agency.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 3,
    name: "Isabella Rodriguez",
    position: "CEO and Co-founder of ABC Company", 
    message: "Their ability to capture our brand essence in every project is unparalleled - an invaluable creative collaborator.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 4,
    name: "Michael Chen",
    position: "CEO and Co-founder of ABC Company",
    message: "Creative genius who understands our vision and consistently delivers outstanding results.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 5,
    name: "John Peter",
    position: "CEO and Co-founder of ABC Company",
    message: "Their team's artistic flair and strategic approach resulted in remarkable campaigns - a reliable creative partner.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  {
    id: 6,
    name: "Natalie Martinez",
    position: "CEO and Co-founder of ABC Company",
    message: "From concept to execution, their creativity knows no bounds - a game-changer for our brand's success.",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
  }
];

// Komponen TestimonialCard
function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div className="min-w-[400px] bg-gray-100 rounded-lg p-6 mx-4 shadow-sm">
      <div className="mb-4">
        <div className="text-4xl text-blue-600 mb-2">"</div>
        <p className="text-gray-800 text-base leading-relaxed">{testimonial.message}</p>
      </div>
      <div className="flex items-center">
        <img 
          src={testimonial.avatar} 
          alt={testimonial.name}
          className="w-12 h-12 rounded-full mr-4 object-cover"
        />
        <div>
          <div className="font-semibold text-gray-900">{testimonial.name}</div>
          <div className="text-sm text-gray-600">{testimonial.position}</div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  // Split testimonials menjadi dua baris
  const firstRow = testimonials.slice(0, 3);
  const secondRow = testimonials.slice(3, 6);

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Words of praise from others<br />
          about our presence.
        </h2>
      </div>
      
      {/* Baris pertama - geser ke kanan */}
      <div className="relative mb-8">
        <div className="flex animate-marquee-right">
          {[...firstRow, ...firstRow].map((testimonial, index) => (
            <TestimonialCard key={`first-${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

      {/* Baris kedua - geser ke kiri */}
      <div className="relative">
        <div className="flex animate-marquee-left">
          {[...secondRow, ...secondRow].map((testimonial, index) => (
            <TestimonialCard key={`second-${testimonial.id}-${index}`} testimonial={testimonial} />
          ))}
        </div>
      </div>

    </section>
  );
}