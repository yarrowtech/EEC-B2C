// src/components/Topbar.jsx
import { Mail, Phone, Facebook, Linkedin, Instagram } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Topbar() {
    const location = useLocation();
  // Hide the Topbar on unified dashboard routes
  // if (location.pathname.startsWith("/dashboard")) return null;
  const shouldHide = location.pathname.startsWith("/dashboard");
  // return (
  return shouldHide ? null : (
    <div className="w-full bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        {/* Left: contact */}
        <div className="flex min-w-0 items-center gap-4">
          {/* Desktop: gentle marquee */}
          <div className="relative hidden min-w-max items-center md:flex">
            <div className="flex animate-[scroll-x_18s_linear_infinite] gap-6 whitespace-nowrap">
              <a
                href="tel:+919830590929"
                className="inline-flex items-center gap-2 rounded-md bg-white/0 px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                title="Call us"
              >
                <Phone className="h-4 w-4" />
                <span>+91 9830590929</span>
              </a>
              <span className="opacity-40">|</span>
              <a
                href="mailto:eec@electroniceducare.com"
                className="inline-flex items-center gap-2 rounded-md bg-white/0 px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                title="Email us"
              >
                <Mail className="h-4 w-4" />
                <span>eec@electroniceducare.com</span>
              </a>
            </div>
          </div>

          {/* Mobile: compact */}
          <div className="flex items-center gap-3 md:hidden">
            <a
              href="tel:+919830590929"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              title="Call us"
            >
              <Phone className="h-4 w-4" />
              <span className="truncate">+91 9830590929</span>
            </a>
            <span className="opacity-40">•</span>
            <a
              href="mailto:eec@electroniceducare.com"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              title="Email us"
            >
              <Mail className="h-4 w-4" />
              <span className="truncate">eec@electroniceducare.com</span>
            </a>
          </div>
        </div>

        {/* Right: socials + WhatsApp chip */}
        <div className="flex items-center gap-2">
          <a
            href="https://www.instagram.com/its_eec_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            aria-label="Instagram"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 transition hover:bg-white/15 hover:ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
          >
            <Instagram className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/company/electronic-educare-eec/"
            target="_blank"
            aria-label="LinkedIn"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 transition hover:bg-white/15 hover:ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href="https://wa.me/919830590929"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide shadow-sm transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            aria-label="Chat on WhatsApp"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
            WhatsApp
          </a>
        </div>
      </div>

      {/* tiny gradient hairline */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
  // );
}

/* Tailwind keyframes (add once in your CSS if not present):
@keyframes scroll-x {
  0% { transform: translateX(0) }
  100% { transform: translateX(-50%) }
}
*/
