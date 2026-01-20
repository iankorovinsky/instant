import { Inter } from "next/font/google";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Footer } from "@/components/home/Footer";
import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { LogoCarousel } from "@/components/home/LogoCarousel";
import { Products } from "@/components/home/Products";
import { Solutions } from "@/components/home/Solutions";
import { Stats } from "@/components/home/Stats";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function Home() {
  return (
    <main className={`${inter.className} min-h-screen bg-[#fbfbfb]`}>
      <Header />
      <Hero />
      <LogoCarousel />
      <Stats />
      <Products />
      <Solutions />
      <FinalCTA />
      <Footer />
    </main>
  );
}
