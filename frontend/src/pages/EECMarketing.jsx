import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EECMarketing() {
  const items = [
    {
      id: "one",
      title: "About EEC – The Future of Education & Commerce",
      body: (
        <h5 className="text-blue-900/90">
          At Electronic Educare (EEC), we are reshaping the way students learn, engage, and shop for educational
          essentials...
        </h5>
      ),
      defaultOpen: true,
    },
    {
      id: "two",
      title: "Why Partner with EEC?",
      body: (
        <div className="text-blue-900/90 space-y-3">
          <h5>EEC offers an exclusive marketplace designed for vendors...</h5>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Direct Access to Students & Parents</strong> – Sell without the clutter of general marketplaces.
            </li>
            <li>
              <strong>Zero Wasted Marketing Spend</strong> – Target an audience already searching for your products.
            </li>
            <li>
              <strong>Loyalty-Driven Sales</strong> – Students redeem reward points earned through learning.
            </li>
            <li>
              <strong>Seamless Integration</strong> – List products, manage inventory, and process orders effortlessly.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "three",
      title: "Who Can Join Our Marketplace?",
      body: (
        <div className="text-blue-900/90 space-y-3">
          <h5>We welcome vendors and businesses offering:</h5>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Stationery & School Supplies</strong>
            </li>
            <li>
              <strong>Books & Learning Materials</strong>
            </li>
            <li>
              <strong>School Accessories</strong>
            </li>
            <li>
              <strong>EdTech Tools & Gadgets</strong>
            </li>
          </ul>
          <h6>
            If your business serves students, EEC is the ideal platform...
          </h6>
        </div>
      ),
    },
    {
      id: "four",
      title: "What’s in It for Students?",
      body: (
        <div className="text-blue-900/90 space-y-2">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>One-Stop Shopping</strong> – Buy all school essentials in one place.
            </li>
            <li>
              <strong>Redeem & Save</strong> – Earn points through learning and get discounts.
            </li>
            <li>
              <strong>Exclusive Offers & Discounts</strong> – Make education more affordable.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "five",
      title: "How It Works",
      body: (
        <ul className="list-disc pl-6 space-y-1 text-blue-900/90">
          <li>
            <strong>Vendors Register & List Products</strong>
          </li>
          <li>
            <strong>Students Browse & Purchase</strong>
          </li>
          <li>
            <strong>Reward System Boosts Sales</strong>
          </li>
          <li>
            <strong>Hassle-Free Transactions & Delivery</strong>
          </li>
        </ul>
      ),
    },
    {
      id: "six",
      title: "Success Stories: EEC in Action",
      body: (
        <div className="text-blue-900/90 space-y-2">
          <ul className="list-disc pl-6 space-y-1">
            <li>ABC Stationery saw a 40% sales increase in 2 months.</li>
            <li>XYZ Publishers gained loyalty via reward redemptions.</li>
            <li>EduGadget Hub expanded nationwide to underserved cities.</li>
          </ul>
          <h6>
            Join EEC today – Sell smarter, grow faster, and empower students while scaling your business.
          </h6>
          <h6>Partner with EEC – Where Learning Meets Commerce!</h6>
        </div>
      ),
    },
  ];

  const [open, setOpen] = useState(() => new Set(items.filter((i) => i.defaultOpen).map((i) => i.id)));
  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-white text-blue-950 selection:bg-yellow-200/60 overflow-x-hidden">
      {/* ===== Hero Section with Background, Overlay, and Curve Divider ===== */}
      <section className="relative flex h-[70vh] w-full items-center justify-center overflow-hidden bg-[url('/eec-partner-mkt.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 px-6 text-center text-white"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold">Partner with EEC</h1>
          <p className="mx-auto mt-4 max-w-2xl text-blue-100/90">Empowering students and businesses for a better future</p>
        </motion.div>
        <svg className="pointer-events-none absolute -bottom-[1px] left-0 w-full" viewBox="0 0 1440 120" aria-hidden>
          <path fill="#ffffff" d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,80C672,85,768,107,864,117.3C960,128,1056,128,1152,117.3C1248,107,1344,85,1392,74.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
        </svg>
      </section>

      {/* ===== Accordion Section ===== */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-blue-100/60 bg-white shadow-xl">
            {items.map((item, idx) => {
              const isOpen = open.has(item.id);
              return (
                <div key={item.id} className={`border-b border-blue-100/60 ${idx === items.length - 1 ? "last:border-b-0" : ""}`}>
                  <button
                    onClick={() => toggle(item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left hover:bg-blue-50/50"
                  >
                    <h4 className="text-lg font-semibold text-blue-900">{item.title}</h4>
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-blue-200 bg-white text-blue-700">
                      <svg
                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden px-6 pb-6"
                      >
                        <div className="rounded-2xl bg-blue-50/40 p-4">{item.body}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}