import React from 'react'
import Topbar from "../components/Topbar";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import WhatIsEEC from "../components/WhatIsEEC";
import EECFeaturesSection from "../components/EECFeaturesSection";
import EECStages from "../components/EECStages";
import EECUnique from "../components/EECUnique";
import EECImageRow from "../components/EECImageRow";
import EECFAQ from "../components/EECFAQ";
import EECFooter from "../components/EECFooter";
import GlobalLoginModal from "../components/GlobalLoginModal";

const Home = () => {
  return (
    <div>
      {/* <Topbar />
      <Navbar /> */}
      <Hero />
      <WhatIsEEC />
      <EECFeaturesSection />
      <EECStages />
      <EECUnique />
      <EECImageRow />
      <EECFAQ />
      {/* <GlobalLoginModal /> */}
      {/* <EECFooter /> */}
    </div>
  )
}

export default Home
