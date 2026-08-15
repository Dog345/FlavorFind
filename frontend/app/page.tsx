import Header from "@/components/Header";
import Features from "@/components/Features";
import Dishes from "@/components/Dishes";
import Story from "@/components/Story";
import ChefSpecial from "@/components/ChefSpecial";
import Favorites from "@/components/Favorites";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Header />
      <Features />
      <Dishes />
      <Story />
      <ChefSpecial />
      <Favorites />
      <Footer />
    </main>
  );
}
