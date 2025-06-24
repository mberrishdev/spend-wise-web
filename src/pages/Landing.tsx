import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  BarChart3,
  Calendar,
  DollarSign,
  Globe,
  Smartphone,
  UserCheck,
  ChevronDown,
} from "lucide-react";

const features = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    title: "Secure Google Sign-In",
    desc: "Your data is protected and only accessible by you.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-green-600" />,
    title: "Visual Insights",
    desc: "See your spending trends and budget progress at a glance.",
  },
  {
    icon: <Calendar className="w-6 h-6 text-purple-600" />,
    title: "Monthly Planning",
    desc: "Set your budget and track your goals every month.",
  },
  {
    icon: <DollarSign className="w-6 h-6 text-yellow-600" />,
    title: "Multi-currency Support",
    desc: "Track your finances in your preferred currency.",
  },
  {
    icon: <Smartphone className="w-6 h-6 text-pink-600" />,
    title: "Mobile Friendly",
    desc: "Use SpendWise on any device, anywhere.",
  },
  {
    icon: <UserCheck className="w-6 h-6 text-indigo-600" />,
    title: "Privacy First",
    desc: "No ads, no selling your data. 100% private.",
  },
];

const testimonials = [
  {
    quote:
      "SpendWise helped me finally get a grip on my monthly spending. The interface is beautiful and I love that my data is private!",
    name: "Mikehil B.",
    title: "Early Adopter",
    avatar:
      "https://media.licdn.com/dms/image/v2/D4D03AQERrMWyypbYiA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1699293666676?e=1756339200&v=beta&t=PHZTj_rY_bNshyZ5q2NeTNfY02psQtKk4ZxSqrgQ6EA",
  },
  {
    quote:
      "I love how simple and fast SpendWise is. I can log my expenses in seconds, and the summary charts are super helpful!",
    name: "Anna K.",
    title: "Designer",
    avatar:
      "https://media.licdn.com/dms/image/v2/D4D35AQFAZo71OtNOGg/profile-framedphoto-shrink_200_200/profile-framedphoto-shrink_200_200/0/1699706587867?e=1751385600&v=beta&t=MRNWvE2fmXSWZ_ZsL7zRKOj7sFVIHPZKGPxsLbKsDqk",
  },
];

const faqs = [
  {
    q: "Is SpendWise really free?",
    a: "Yes! SpendWise is free to use. We do not show ads or sell your data.",
  },
  {
    q: "Where is my data stored?",
    a: "All your data is securely stored in your own Firebase account, accessible only by you.",
  },
  {
    q: "Can I use SpendWise on my phone?",
    a: "Absolutely! SpendWise is fully responsive and works great on any device.",
  },
  {
    q: "How do I change my currency?",
    a: "Go to Settings after logging in and select your preferred currency.",
  },
  {
    q: "Do you have access to my financial data?",
    a: "No. Only you can access your data. We never see, store, or sell your information.",
  },
];

const FAQAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div
            key={i}
            className="bg-white rounded-lg shadow border border-gray-100"
          >
            <button
              className="w-full flex justify-between items-center px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              aria-controls={`faq-panel-${i}`}
            >
              <span className="font-semibold text-black-700 text-base">
                {faq.q}
              </span>
              <ChevronDown
                className={`w-5 h-5 ml-2 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              id={`faq-panel-${i}`}
              className={`overflow-hidden transition-all duration-300 px-5 ${
                open ? "max-h-40 py-2" : "max-h-0 py-0"
              }`}
              style={{
                maxHeight: open ? "200px" : "0",
                opacity: open ? 1 : 0,
              }}
            >
              <div className="text-gray-600 text-base leading-relaxed">
                {faq.a}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Landing: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-white to-blue-50">
    {/* Hero Section */}
    <header className="w-full px-4 pt-10 pb-16 flex flex-col items-center text-center bg-gradient-to-b from-white/80 to-transparent">
      <img src="/logo.png" alt="SpendWise Logo" className="w-20 h-20 mb-4" />
      <h1 className="text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
        Take Control of Your <span className="text-blue-600">Spending</span>
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-8">
        SpendWise is your privacy-first, Firebase-powered personal finance
        tracker. Plan, log, and understand your spending with ease—on any
        device.
      </p>
      <Link
        to="/login"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow transition mb-2"
      >
        Get Started Free
      </Link>
      <span className="text-xs text-gray-400">No credit card required</span>
    </header>

    {/* Features Section */}
    <section className="max-w-4xl w-full mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {features.map((f, i) => (
        <div
          key={i}
          className="flex flex-col items-center bg-white rounded-xl shadow p-6 gap-3 border border-gray-100"
        >
          <div>{f.icon}</div>
          <div className="font-semibold text-gray-800 text-lg text-center">
            {f.title}
          </div>
          <div className="text-gray-500 text-center text-sm">{f.desc}</div>
        </div>
      ))}
    </section>

    {/* Testimonials Section */}
    <section className="w-full flex flex-col items-center py-10 px-4">
      {/* Divider with label */}
      <div className="flex items-center w-full max-w-4xl mb-10">
        <div className="flex-grow h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
        <span className="mx-4 text-blue-600 font-semibold text-lg flex items-center gap-2 select-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 17a4 4 0 01-4-4V7a4 4 0 014-4h2a4 4 0 014 4v6a4 4 0 01-4 4zm10 0a4 4 0 01-4-4V7a4 4 0 014-4h2a4 4 0 014 4v6a4 4 0 01-4 4z"
            />
          </svg>
          Testimonials
        </span>
        <div className="flex-grow h-px bg-gradient-to-l from-transparent via-blue-200 to-transparent" />
      </div>
      <div className="max-w-4xl w-full flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full md:w-auto justify-items-center">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-4 bg-white rounded-xl shadow p-6 border border-gray-100"
            >
              <blockquote className="italic text-base text-gray-700 text-center">
                “{t.quote}”
              </blockquote>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full border"
                />
                <div className="text-gray-800 font-medium">{t.name}</div>
                <div className="text-gray-500 text-sm">{t.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FAQ Section */}
    <section className="w-full max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center w-full max-w-4xl mb-10">
        <div className="flex-grow h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
        <span className="mx-4 text-blue-600 font-semibold text-lg flex items-center gap-2 select-none">
          FAQs
        </span>
        <div className="flex-grow h-px bg-gradient-to-l from-transparent via-blue-200 to-transparent" />
      </div>
      <FAQAccordion />
    </section>

    {/* Footer */}
    <footer className="w-full py-8 flex flex-col items-center text-gray-400 text-sm mt-auto">
      <div className="mb-1 flex items-center gap-1">
        <span className="text-yellow-400">✨</span>
        <span>Crafted by</span>
        <span className="font-semibold text-blue-500">Vibe Coding</span>
        <span className="text-gray-400">|</span>
        <a
          href="https://github.com/mberrishdev"
          className="hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="mr-1">👨‍💻</span>@mberrishdev
        </a>
      </div>
      <br/>
      <div className="mb-2">
        &copy; {new Date().getFullYear()} SpendWise. All rights reserved.
      </div>
      <div>
        <a
          href="https://github.com/mberrishdev/spend-wise"
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        <span className="mx-2">·</span>
        <a href="/privacy" className="hover:underline">
          Privacy Policy
        </a>
      </div>
    </footer>
  </div>
);

export default Landing;
