import React from "react";
import { Check } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface NewPricingProps {
  onNavigate: (page: string) => void;
}

export const NewPricing: React.FC<NewPricingProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      onNavigate("signup");
      return;
    }
    alert(`Stripe integration ready for ${plan} plan. Please provide your Stripe keys to enable payments.`);
  };

  const plans = [
    {
      name: "Standard",
      badge: "Best value for devs",
      badgeColor: "bg-gradient-to-r from-pink-400 to-pink-500 text-white",
      price: "₹299",
      subLabel: "per year",
      color: "bg-white",
      accent: "bg-gradient-to-r from-pink-500 to-pink-600 text-white",
      iconColor: "text-pink-500",
      description: "Ideal for individuals",
      features: [
        "Up to 50 extensions/year",
        "All browser targets",
        "Live preview & code export",
        "Basic customization",
        "Community support",
      ],
    },
    {
      name: "Pro",
      badge: "Most Popular",
      badgeColor: "bg-gradient-to-r from-purple-400 to-purple-500 text-white",
      price: "₹499",
      subLabel: "per month",
      color: "bg-white",
      accent: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      iconColor: "text-purple-500",
      description: "For serious developers",
      features: [
        "Unlimited extensions",
        "All browser targets",
        "Live preview & code export",
        "Priority support",
        "Advanced customization",
        "Email support",
      ],
      popular: true,
    },
    {
      name: "Lifetime",
      badge: "Unlimited Forever",
      badgeColor: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black",
      price: "₹999",
      subLabel: "one-time",
      color: "bg-white",
      accent: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black",
      iconColor: "text-yellow-500",
      description: "Unlock all features forever",
      features: [
        "Unlimited extensions",
        "All browser targets",
        "Live preview & code export",
        "Priority support",
        "Advanced customization",
        "All feature updates, always",
        "Dedicated account manager",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Hero Section */}
      <section className="pt-20 pb-8 px-3 md:px-0">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-2">All Plans Include</h2>
          <p className="text-lg text-gray-600 mb-2">
            Build, preview, and publish unlimited browser extensions with all plans.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 px-3 md:px-0 flex-grow">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-stretch gap-7">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`w-full lg:w-1/3 rounded-3xl border border-gray-200 shadow-lg
                flex flex-col relative overflow-hidden ${plan.color} transition-all duration-300 hover:scale-[1.02]`}
              style={{
                minWidth: 0,
                boxShadow: plan.popular
                  ? "0 10px 25px -5px rgba(139, 92, 246, 0.2)"
                  : "0 4px 20px 0 rgba(0,0,0,0.05)",
                borderColor: plan.popular ? "#A78BFA" : "#E5E7EB",
              }}
            >
              {/* Badge */}
              <span
                className={`absolute top-4 left-4 px-4 py-1 rounded-full font-bold text-sm ${plan.badgeColor}`}
                style={{ letterSpacing: "0.04em" }}
              >
                {plan.badge}
              </span>
              {/* Popular Overlay */}
              {plan.popular && (
                <span className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full font-bold text-xs shadow-lg">
                  MOST POPULAR
                </span>
              )}

              <div className={`px-8 pt-16 pb-8 flex flex-col flex-1`}>
                <div className="mb-4">
                  {/* Icon and Name */}
                  <div className="flex items-center gap-2 mb-2">
                    <Check className={`w-7 h-7 ${plan.iconColor}`} />
                    <span className={`text-3xl font-extrabold ${plan.iconColor}`}>
                      {plan.name}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-base text-gray-500 pb-1">{plan.subLabel}</span>
                  </div>
                  <div className="text-gray-600 mt-1 mb-5 text-sm">{plan.description}</div>
                </div>
                <ul className="flex flex-col gap-3 text-base text-gray-700 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.iconColor}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.name.toLowerCase())}
                  className={`${plan.accent} w-full py-4 rounded-full font-bold text-white text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  Get Started
                </button>
                {!plan.popular && (
                  <button className="w-full mt-3 py-4 rounded-full font-bold text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all duration-300">
                    One-time payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-10 px-6 md:px-12 text-center max-w-7xl mx-auto text-gray-500 text-xs">
        © 2025 ExtensionBuilder. All rights reserved.
      </footer>
    </div>
  );
};
