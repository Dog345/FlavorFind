import { LeafBadgeIcon, ChefHatIcon, DiningIcon, ReservationIcon } from "./Icons";

const features = [
  {
    icon: LeafBadgeIcon,
    title: "Search by Ingredient",
    desc: "Enter what you have at home and instantly discover recipes you can make right now.",
  },
  {
    icon: ChefHatIcon,
    title: "Thousands of Recipes",
    desc: "Browse a vast collection of recipes from cuisines around the world.",
  },
  {
    icon: DiningIcon,
    title: "Filter by Diet & Cuisine",
    desc: "Vegetarian, vegan, gluten-free and more — find recipes that match your lifestyle.",
  },
  {
    icon: ReservationIcon,
    title: "Save Your Favorites",
    desc: "Bookmark recipes you love and build your personal recipe collection.",
  },
];

export default function Features() {
  return (
    <section className="relative z-[3] -mt-[70px] hidden lg:block">
      {/* On mobile: horizontal scroll row. On lg+: normal 4-col grid */}
      <div className="mx-auto max-w-[1240px] px-8">
        <div className="flex gap-[22px] overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0 scrollbar-hide">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex-shrink-0 w-[58vw] max-w-[240px] lg:w-auto lg:max-w-none rounded-md2 bg-cream-2 px-[18px] py-[24px] text-center shadow-card"
            >
              <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full bg-green-deep">
                <Icon className="h-[26px] w-[26px]" />
              </div>
              <h3 className="mb-2 text-[16.5px] font-display text-green-deep">
                {title}
              </h3>
              <p className="text-[13.5px] leading-[1.6] text-ink-soft">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
