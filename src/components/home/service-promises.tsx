import { CardIcon, LeafIcon, ShieldIcon, TruckIcon } from "@/components/icons";

const promises = [
  { icon: TruckIcon, title: "Book 3–5 days ahead", body: "Pick your delivery date at checkout." },
  { icon: LeafIcon, title: "Arranged to order", body: "Fresh, seasonal blooms prepared for your date." },
  { icon: CardIcon, title: "Handwritten card", body: "Add a personal note at no cost." },
  { icon: ShieldIcon, title: "No online payment", body: "Our team contacts you to arrange payment." },
];

export function ServicePromises() {
  return (
    <section aria-label="Why shop with us" className="border-y border-line">
      <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4 lg:py-12">
        {promises.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Icon className="shrink-0 text-primary" width={28} height={28} />
            <div>
              <h3 className="text-sm font-medium md:text-base">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
