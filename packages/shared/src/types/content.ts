export type Banner = {
  id: string;
  title: string;
  image: string;
  link?: string;
  position: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type HomepageHero = {
  eyebrow: string;
  heading: string;
  headingAccent: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
};
