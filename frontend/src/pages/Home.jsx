import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Hero from "../components/Hero";
import StudyGrumpySection from "../components/StudyGrumpySection";
import VictoryPathSection from "../components/VictoryPathSection";
import FeatureCardsSection from "../components/FeatureCardsSection";
import StatsStripSection from "../components/StatsStripSection";
import HeroRankSection from "../components/HeroRankSection";
import QuickBundleSection from "../components/QuickBundleSection";
import StarExplorersSection from "../components/StarExplorersSection";
import QuestionsAnswersSection from "../components/QuestionsAnswersSection";
import PaprIqFooterSection from "../components/PaprIqFooterSection";
import WhatIsEEC from "../components/WhatIsEEC";
import EECFeaturesSection from "../components/EECFeaturesSection";
import EECStages from "../components/EECStages";
import EECUnique from "../components/EECUnique";
import EECImageRow from "../components/EECImageRow";
import EECFAQ from "../components/EECFAQ";
import EECFooter from "../components/EECFooter";
import GlobalLoginModal from "../components/GlobalLoginModal";
import PageIntroLoader from "../components/PageIntroLoader";
import usePageIntroLoader from "../hooks/usePageIntroLoader";
import HeroFilterBar from "../components/HeroFilterBar";
import HomePurposeSection from "../components/HomePurposeSection";
import HomeFeaturesSection from "../components/HomeFeaturesSection";


const Home = () => {
  const loading = usePageIntroLoader("eec:home:loaded");
  const location = useLocation();
  const [siteName, setSiteName] = useState("Edify Eight");

  useEffect(() => {
    let mounted = true;
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

    async function loadWebsiteSettings() {
      try {
        const res = await fetch(`${API}/api/website-settings`);
        const data = await res.json().catch(() => ({}));
        if (!mounted || !res.ok) return;
        setSiteName(String(data?.siteName || "Edify Eight").trim() || "Edify Eight");
      } catch {
        // keep fallback
      }
    }

    loadWebsiteSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (location.hash !== "#hero-signup") return;

    const t = setTimeout(() => {
      const target = document.getElementById("hero-signup");
      if (!target) return;

      const isDesktop = window.innerWidth >= 1024;
      const offset = Math.max(
        isDesktop ? 180 : 128,
        Math.round(window.innerHeight * (isDesktop ? 0.18 : 0.12))
      );
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    }, 0);

    return () => clearTimeout(t);
  }, [loading, location.hash]);

  return (
    <AnimatePresence>
      {loading ? (
        <PageIntroLoader key="intro-loader" message={`Welcome to ${siteName}...`} />
      ) : (
        <motion.div
          key="home-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="overflow-x-hidden block w-full max-w-[100vw]"
        >
          <Hero />
          <HeroFilterBar />
          <HomePurposeSection />
          <StudyGrumpySection />
          <VictoryPathSection />
          <HomeFeaturesSection />
          <FeatureCardsSection />
          <StatsStripSection />
          <StarExplorersSection />
          <QuestionsAnswersSection />
          <QuickBundleSection />
          {/* <PaprIqFooterSection />  */}
          {/* <WhatIsEEC />
          <EECFeaturesSection />
          <EECStages />
          <EECUnique />
          <EECImageRow />
          <EECFAQ />
          <GlobalLoginModal />
          <EECFooter /> */}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Home
