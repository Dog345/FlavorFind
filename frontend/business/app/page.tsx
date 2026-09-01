import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import DishReveal from '@/components/DishReveal'
import NoteReveal from '@/components/NoteReveal'
import HowItWorks from '@/components/HowItWorks'
import TodaysPick from '@/components/TodaysPick'
import WeeklyPick from '@/components/WeeklyPick'
import ExploreMore from '@/components/ExploreMore'
import FlavorsSection from '@/components/FlavorsSection'
import WhatEveryonesCooking from '@/components/WhatEveryonesCooking'
import CommunityReviews from '@/components/CommunityReviews'
import CommunityFavorites from '@/components/CommunityFavorites'
import OurStory from '@/components/OurStory'
import RandomRecipe from '@/components/RandomRecipe'
import RecipeStrip from '@/components/RecipeStrip'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <DishReveal />
      <NoteReveal />
      <HowItWorks />
      <TodaysPick />
      <WeeklyPick />
      <ExploreMore />
      <FlavorsSection />
      <CommunityReviews />
      <CommunityFavorites />
      <OurStory />
      <RandomRecipe />
      <WhatEveryonesCooking />
      <RecipeStrip />
      <Footer />
      {/* Sections added here one by one */}
    </main>
  )
}
