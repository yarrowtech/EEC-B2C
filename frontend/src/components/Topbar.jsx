// src/components/Topbar.jsx
import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Facebook, Linkedin, Instagram } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Topbar() {
  const location = useLocation();
  const API = import.meta.env.VITE_API_URL || "";
  const [officeData, setOfficeData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadOffice() {
      try {
        const res = await fetch(`${API}/api/office`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        setOfficeData(data);
      } catch {
        // Keep hardcoded fallback values.
      }
    }
    loadOffice();
    return () => {
      cancelled = true;
    };
  }, [API]);

  const phone = useMemo(() => {
    const contactPhone = Array.isArray(officeData?.contacts)
      ? officeData.contacts.find((c) => c?.type === "phone")?.value
      : "";
    return String(contactPhone || officeData?.phone || "+91 9830590929").trim();
  }, [officeData]);

  const email = useMemo(() => {
    const contactEmail = Array.isArray(officeData?.contacts)
      ? officeData.contacts.find((c) => c?.type === "email")?.value
      : "";
    return String(contactEmail || officeData?.email || "eec@electroniceducare.com").trim();
  }, [officeData]);

  const address = useMemo(() => {
    const contactAddress = Array.isArray(officeData?.contacts)
      ? officeData.contacts.find((c) => c?.type === "address")?.value
      : "";
    return String(contactAddress || officeData?.address || "").trim();
  }, [officeData]);

  const socialLinks = useMemo(
    () => ({
      instagram: String(officeData?.socialLinks?.instagram || "").trim(),
      linkedin: String(officeData?.socialLinks?.linkedin || "").trim(),
      facebook: String(officeData?.socialLinks?.facebook || "").trim(),
    }),
    [officeData]
  );

  const whatsappLink = useMemo(() => {
    const digits = phone.replace(/[^\d+]/g, "");
    if (!digits) return "";
    const normalized = digits.startsWith("+") ? digits.slice(1) : digits;
    return `https://wa.me/${normalized}`;
  }, [phone]);

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
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-md bg-white/0 px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                title="Call us"
              >
                <Phone className="h-4 w-4" />
                <span>{phone}</span>
              </a>
              <span className="opacity-40">|</span>
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-md bg-white/0 px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
                title="Email us"
              >
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </a>
              {/* {address && (
                <>
                  <span className="opacity-40">|</span>
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/0 px-2 py-1 opacity-90">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span>{address}</span>
                  </span>
                </>
              )} */}
            </div>
          </div>

          {/* Mobile: compact */}
          <div className="flex items-center gap-3 md:hidden">
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              title="Call us"
            >
              <Phone className="h-4 w-4" />
              <span className="truncate">{phone}</span>
            </a>
            <span className="opacity-40">•</span>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 opacity-90 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              title="Email us"
            >
              <Mail className="h-4 w-4" />
              <span className="truncate">{email}</span>
            </a>
          </div>
        </div>

        {/* Right: socials + WhatsApp chip */}
        <div className="flex items-center gap-2">
          {socialLinks.instagram && (
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hidden md:inline-flex lg:inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 transition hover:bg-white/15 hover:ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            >
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {socialLinks.linkedin && (
            <a
              href={socialLinks.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="hidden md:inline-flex lg:inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 transition hover:bg-white/15 hover:ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          )}
          {socialLinks.facebook && (
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="hidden md:inline-flex lg:inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/10 transition hover:bg-white/15 hover:ring-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            >
              <Facebook className="h-4 w-4" />
            </a>
          )}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide shadow-sm transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
              aria-label="Chat on WhatsApp"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
              WhatsApp
            </a>
          )}
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
