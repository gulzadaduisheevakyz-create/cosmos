import React, { useState } from 'react';
import {
  Sparkles,
  Phone,
  Mail,
  Clock,
  MapPin,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Award,
  HeartHandshake,
  CheckCircle2,
  Lock,
  Upload,
  Send,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import { PublicSalonInfo, ServiceCatalogueItem, UserAccount } from '../types';
import { db } from '../services/db';

interface LandingPageProps {
  salonInfo: PublicSalonInfo;
  services: ServiceCatalogueItem[];
  currentUser: UserAccount | null;
  onOpenStaffPortal: () => void;
  onOpenBookingModal: (serviceId?: string, category?: string) => void;
  onRefreshInfo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  salonInfo,
  services,
  currentUser,
  onOpenStaffPortal,
  onOpenBookingModal,
  onRefreshInfo,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Spam protection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    details?: string;
  } | null>(null);

  // Logo upload modal state (Admins only)
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState(salonInfo.logoUrl || '');

  // Filter services by category
  const activeCategories = Array.from(
    new Set(services.filter((s) => s.isActive).map((s) => s.category))
  );

  const displayedServices = services.filter((s) => {
    if (!s.isActive) return false;
    if (selectedCategory === 'All') return true;
    return s.category === selectedCategory;
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      // Spam bot triggered
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const res = await db.submitContactMessage({
        name: contactName,
        email: contactEmail,
        mobile: contactMobile,
        message: contactMessage,
      });

      if (res.success) {
        setSubmitFeedback({
          type: 'success',
          message: res.message,
          details: res.emailDelivered
            ? 'A confirmation notice has been dispatched.'
            : 'Your message has been securely recorded in the salon inquiry inbox for front-desk follow-up.',
        });
        setContactName('');
        setContactEmail('');
        setContactMobile('');
        setContactMessage('');
      } else {
        setSubmitFeedback({
          type: 'error',
          message: res.message,
        });
      }
    } catch {
      setSubmitFeedback({
        type: 'error',
        message: 'Unable to send message at this moment. Please call +974 7045 0040 directly.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo image size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    await db.savePublicSalonInfo({
      ...salonInfo,
      logoUrl: logoPreview,
    });
    setIsEditingLogo(false);
    onRefreshInfo();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Notification Strip */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border-b border-rose-900/40 text-[11px] sm:text-xs text-rose-200 py-1.5 px-4 text-center flex items-center justify-center gap-4">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          Cosmos Beauty Salon · Luxury Treatments & Precision Artistry in Doha
        </span>
        <div className="hidden sm:flex items-center gap-3 text-slate-400">
          <a
            href="tel:+97470450040"
            className="hover:text-rose-300 transition-colors flex items-center gap-1"
          >
            <Phone className="w-3 h-3 text-rose-400" />
            +974 7045 0040
          </a>
          <span>·</span>
          <a
            href="mailto:csmsbeauty@gmail.com"
            className="hover:text-rose-300 transition-colors flex items-center gap-1"
          >
            <Mail className="w-3 h-3 text-rose-400" />
            csmsbeauty@gmail.com
          </a>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Salon Brand */}
          <div className="flex items-center gap-3">
            {salonInfo.logoUrl ? (
              <img
                src={salonInfo.logoUrl}
                alt="Cosmos Beauty Salon Logo"
                className="w-12 h-12 object-contain rounded-xl border border-rose-500/30 bg-slate-900/80 p-1"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 via-pink-700 to-purple-800 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-rose-950/50 border border-rose-400/30">
                CB
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-serif">
                  {salonInfo.salonName}
                </span>
                {currentUser?.role === 'Super Administrator' && (
                  <button
                    onClick={() => setIsEditingLogo(true)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                    title="Change salon logo"
                  >
                    <Upload className="w-2.5 h-2.5" />
                    Logo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-rose-300/80 tracking-wider uppercase font-medium">
                Doha · State of Qatar
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#home" className="hover:text-rose-400 transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-rose-400 transition-colors">
              About
            </a>
            <a href="#services" className="hover:text-rose-400 transition-colors">
              Services
            </a>
            <a href="#contact" className="hover:text-rose-400 transition-colors">
              Contact
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenBookingModal()}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md shadow-rose-950/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={onOpenStaffPortal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
              title="Open staff and administration management portal"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>{currentUser ? 'Staff Dashboard' : 'Staff Portal'}</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
            <a
              href="#home"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-200 hover:text-rose-400"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-200 hover:text-rose-400"
            >
              About
            </a>
            <a
              href="#services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-200 hover:text-rose-400"
            >
              Services
            </a>
            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-200 hover:text-rose-400"
            >
              Contact
            </a>
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenBookingModal();
                }}
                className="w-full py-2.5 rounded-lg bg-rose-600 text-white text-xs font-semibold text-center"
              >
                Book an Appointment
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative py-20 lg:py-32 overflow-hidden bg-radial from-slate-900 via-slate-950 to-slate-950"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/70 border border-rose-800/60 text-rose-300 text-xs font-medium tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                <span>Premier Luxury Beauty Sanctuary · Doha, Qatar</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-serif leading-[1.15]">
                {salonInfo.headline}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                {salonInfo.shortWelcome}
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onOpenBookingModal()}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-700 hover:from-rose-500 hover:to-purple-600 text-white font-semibold text-sm shadow-xl shadow-rose-950/60 flex items-center gap-2 transition-all hover:translate-y-[-1px]"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book an Appointment</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <a
                  href="#contact"
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
                >
                  Contact Salon
                </a>
              </div>

              {/* Verified Contact Bar */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <a
                  href="tel:+97470450040"
                  className="flex items-center gap-2 hover:text-rose-400 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Direct Call</p>
                    <p className="font-medium text-slate-200">+974 7045 0040</p>
                  </div>
                </a>

                <a
                  href="mailto:csmsbeauty@gmail.com"
                  className="flex items-center gap-2 hover:text-rose-400 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Inquiries</p>
                    <p className="font-medium text-slate-200">csmsbeauty@gmail.com</p>
                  </div>
                </a>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Hours</p>
                    <p className="font-medium text-slate-200">{salonInfo.workingHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Highlight Cards Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
                <span className="text-2xl">👁️</span>
                <h3 className="text-base font-bold text-white">Russian Lash Art</h3>
                <p className="text-xs text-slate-400">
                  Precision 3D-5D Russian volume extensions and keratin lash lift rituals.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2 mt-4">
                <span className="text-2xl">💅</span>
                <h3 className="text-base font-bold text-white">Gel & Nail Couture</h3>
                <p className="text-xs text-slate-400">
                  Hard gel nail extensions, French manicures, and bespoke hand-painted nail art.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2">
                <span className="text-2xl">✨</span>
                <h3 className="text-base font-bold text-white">Hair Styling & Glow</h3>
                <p className="text-xs text-slate-400">
                  Balayage toning, Olaplex restorative masks, and red-carpet blowouts.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-2 mt-4">
                <span className="text-2xl">🌸</span>
                <h3 className="text-base font-bold text-white">Royal Spa & Tan</h3>
                <p className="text-xs text-slate-400">
                  Moroccan Hammam, Swedish massage, and Mediterranean express spray tan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-950 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400">
                <Award className="w-4 h-4" />
                <span>Our Philosophy & Craft</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
                {salonInfo.aboutTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {salonInfo.aboutDescription}
              </p>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Our Mission
                </h4>
                <p className="text-xs text-slate-300 italic">{salonInfo.mission}</p>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-base font-bold text-slate-200">Our Core Principles</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {salonInfo.values.map((v, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-slate-200 leading-snug">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Catalogue Section (Live Data) */}
      <section id="services" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Cosmos Treatment Menu
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">
              Signature Services & Rituals
            </h2>
            <p className="text-sm text-slate-400">
              Explore our comprehensive catalogue of professional beauty services in Doha, performed
              by licensed specialists with premium care.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === 'All'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Services
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedServices.map((srv) => (
              <div
                key={srv.id}
                className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 transition-all hover:translate-y-[-2px] flex flex-col justify-between group shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-800/40">
                      {srv.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {srv.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                    {srv.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    Professional salon treatment utilizing hypoallergenic materials and precision
                    sterilized instruments.
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Price</span>
                    <p className="text-lg font-extrabold text-white font-mono">
                      {srv.price} <span className="text-xs text-rose-400 font-sans">QAR</span>
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenBookingModal(srv.id, srv.category)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 group-hover:bg-rose-600 text-slate-300 group-hover:text-white border border-slate-700 group-hover:border-rose-500 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Contact Info */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Get in Touch
              </span>
              <h2 className="text-3xl font-extrabold text-white font-serif">
                Visit Cosmos Beauty Salon
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                We invite you to reach out for bookings, bespoke bridal consultation, home service
                arrangements, or inquiries.
              </p>

              <div className="space-y-4 pt-2">
                <a
                  href="tel:+97470450040"
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 flex items-center gap-4 transition-all block group"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-950/70 border border-rose-800/60 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Telephone / Mobile</p>
                    <p className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                      +974 7045 0040
                    </p>
                    <p className="text-[11px] text-slate-500">Tap to call directly</p>
                  </div>
                </a>

                <a
                  href="mailto:csmsbeauty@gmail.com"
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 flex items-center gap-4 transition-all block group"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-950/70 border border-rose-800/60 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Official Salon Email</p>
                    <p className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                      csmsbeauty@gmail.com
                    </p>
                    <p className="text-[11px] text-slate-500">Tap to open email client</p>
                  </div>
                </a>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Salon Location</p>
                    <p className="text-sm font-bold text-white">{salonInfo.address}</p>
                    <p className="text-[11px] text-slate-500">Opening Hours: {salonInfo.workingHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-7">
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Send Us a Direct Message</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Please provide your contact information below. Our reception team will get in touch promptly.
                  </p>
                </div>

                {submitFeedback && (
                  <div
                    className={`p-4 rounded-xl flex items-start gap-3 text-xs ${
                      submitFeedback.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-800 text-rose-200'
                    }`}
                  >
                    {submitFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">{submitFeedback.message}</p>
                      {submitFeedback.details && (
                        <p className="text-slate-300">{submitFeedback.details}</p>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {/* Honeypot hidden input for spam protection */}
                  <div className="hidden" aria-hidden="true">
                    <input
                      type="text"
                      name="website_url"
                      tabIndex={-1}
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sheikha Al-Kuwari"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. client@domain.qa"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Mobile / WhatsApp Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +974 5512 8899"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Your Message or Request <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please specify desired services, preferred date, or general questions..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-hidden focus:border-rose-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Sending message...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message to Cosmos Beauty Salon</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-sm">
                  CB
                </div>
                <span className="text-base font-bold text-white font-serif">
                  {salonInfo.salonName}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Cosmos Beauty Salon is a premier beauty and personal-care destination in Doha, Qatar.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-1.5">
                <li>
                  <a href="#home" className="hover:text-rose-400 transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-rose-400 transition-colors">
                    About the Salon
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-rose-400 transition-colors">
                    Services Catalogue
                  </a>
                </li>
                <li>
                  <a href="#contact" className="hover:text-rose-400 transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contact Details</h4>
              <ul className="space-y-1.5 text-slate-300">
                <li>
                  <a href="tel:+97470450040" className="hover:text-rose-400 transition-colors">
                    Tel: +974 7045 0040
                  </a>
                </li>
                <li>
                  <a href="mailto:csmsbeauty@gmail.com" className="hover:text-rose-400 transition-colors">
                    Email: csmsbeauty@gmail.com
                  </a>
                </li>
                <li>Doha, State of Qatar</li>
                <li>Hours: 09:00 AM – 09:00 PM</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Administration</h4>
              <p className="text-xs text-slate-400">
                Restricted portal for authorized Cosmos management, payroll, and staff.
              </p>
              <button
                onClick={onOpenStaffPortal}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Staff Login Portal</span>
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Cosmos Beauty Salon. All rights reserved.</p>
            <p>Doha, State of Qatar · Professional Salon Management</p>
          </div>
        </div>
      </footer>

      {/* Admin Logo Upload Modal */}
      {isEditingLogo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Upload Salon Logo</h3>
              <button
                onClick={() => setIsEditingLogo(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select an image file (PNG, JPG, or SVG, under 2MB) to represent Cosmos Beauty Salon.
            </p>

            <div className="flex items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950">
              {logoPreview ? (
                <div className="text-center space-y-2">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-24 h-24 object-contain mx-auto rounded-lg bg-slate-900 p-2"
                  />
                  <p className="text-[11px] text-slate-400">Current Logo Preview</p>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs">No logo loaded</div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-700 cursor-pointer"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsEditingLogo(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLogo}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Save Logo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
