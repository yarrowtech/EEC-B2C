import React, { useState, useEffect } from 'react'
import { motion } from "framer-motion";
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

const Home = () => {
  const [loading, setLoading] = useState(() => {
    // Check if home page was already loaded in this session
    const hasLoaded = sessionStorage.getItem('eec:home:loaded');
    return !hasLoaded; // Only show loading if not previously loaded
  });

  useEffect(() => {
    if (loading) {
      // Simulate loading time for home page on first visit
      const timer = setTimeout(() => {
        setLoading(false);
        // Mark as loaded in session
        sessionStorage.setItem('eec:home:loaded', 'true');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Loading component
  if (loading) {
    return (
      <>
        <style>
          {`
            .heart-loader {
              width: 60px;
              aspect-ratio: 1;
              background: linear-gradient(#dc1818 0 0) bottom/100% 0% no-repeat #f5e6c8;
              -webkit-mask:
                radial-gradient(circle at 60% 65%, #000 62%, #0000 65%) top left,
                radial-gradient(circle at 40% 65%, #000 62%, #0000 65%) top right,
                linear-gradient(to bottom left, #000 42%, #0000 43%) bottom left,
                linear-gradient(to bottom right, #000 42%, #0000 43%) bottom right;
              -webkit-mask-size: 50% 50%;
              -webkit-mask-repeat: no-repeat;
              mask:
                radial-gradient(circle at 60% 65%, #000 62%, #0000 65%) top left,
                radial-gradient(circle at 40% 65%, #000 62%, #0000 65%) top right,
                linear-gradient(to bottom left, #000 42%, #0000 43%) bottom left,
                linear-gradient(to bottom right, #000 42%, #0000 43%) bottom right;
              mask-size: 50% 50%;
              mask-repeat: no-repeat;
              animation: heart-fill 2s infinite linear;
            }
            @keyframes heart-fill {
              90%, 100% { background-size: 100% 100%; }
            }
          `}
        </style>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="heart-loader" />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg font-semibold text-slate-800"
            >
              Welcome to EEC...
            </motion.p>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      <StudyGrumpySection />
      <VictoryPathSection />
      <FeatureCardsSection />
      <StatsStripSection />
      <HeroRankSection />
      <QuickBundleSection />
      <StarExplorersSection />
      <QuestionsAnswersSection />
      {/* <PaprIqFooterSection /> */}
      {/* <WhatIsEEC /> */}
      {/* <EECFeaturesSection /> */}
      {/* <EECStages /> */}
      {/* <EECUnique /> */}
      {/* <EECImageRow /> */}
      {/* <EECFAQ /> */}
      {/* <GlobalLoginModal /> */}
      {/* <EECFooter /> */}
    </motion.div>
  )
}

export default Home
