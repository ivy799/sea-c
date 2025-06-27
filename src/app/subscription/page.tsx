import NavbarComponent from "../components/navbar-components";
import SubscriptionForm from "../components/subscription-form";

export default function SubscriptionPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <NavbarComponent />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-8">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Choose Your <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Subscription Plan</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Customize your meal delivery experience with our flexible subscription options.
              Select your preferred plan, meal types, and delivery schedule.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Flexible Schedule
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Multiple Plans
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Weekly Delivery
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Form */}
      <SubscriptionForm />

      {/* Benefits Section */}
      <section className="px-8 pb-16">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
              Why Choose Our Subscription?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🚚</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reliable Delivery</h3>
                <p className="text-gray-600">Fresh meals delivered to your doorstep on schedule, every time.</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cost Effective</h3>
                <p className="text-gray-600">Save money with our subscription plans compared to individual orders.</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Flexible Options</h3>
                <p className="text-gray-600">Customize your meal plan to fit your lifestyle and dietary needs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
