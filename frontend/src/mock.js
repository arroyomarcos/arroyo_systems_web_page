// Mock data for Arroyo Systems replica

export const ASSETS = {
  logo: "/assets/brand/logo-arroyo-systems-transparent.png",
  hero: "https://arroyo-systems.com/assets/engineering/machined-component-hero.png",
  safetyFactor: "https://arroyo-systems.com/assets/engineering/safety-factor-component.png",
  safetyFactorLegend: "https://arroyo-systems.com/assets/engineering/safety-factor-legend.png",
  threeDConnexionLogo: "/assets/brand/3dconnexion-logo.png",
};

export const NAV_LINKS = [
  { label: "Engineering Solutions", href: "/#products" },
  { label: "Why Us", href: "/#why-us" },
  { label: "Partners", href: "/#partners" },
];

export const PARTNERS = [
  {
    id: "3dconnexion",
    name: "3Dconnexion",
    logo: "threeDConnexionLogo",
    url: "https://3dconnexion.com",
    description:
      "3Dconnexion joins Arroyo Systems as a Technology Partner, bringing precision 3D navigation and control hardware into our engineering workflow.",
  },
];

export const CONTACT_URL = "https://forms.gle/FXNFHgEaYVS8Afbr7";
export const LINKEDIN_URL = "https://www.linkedin.com/company/arroyo-systems-eng/";
export const EMAIL = "contact@arroyo-systems.com";

export const WHY_US_BULLETS = [
  "Pricing is public. You see the range before you talk to us.",
  "Turnaround is measured in business days — most projects ship in one to three weeks, start to finish.",
  "Every design ships with structural validation. Not just a part that looks right — one that's proven to hold.",
];

export const PACKAGES = [
  {
    id: "rapid-design",
    name: "Rapid Design",
    tagline: "Turn your idea into a part you can manufacture. Fast.",
    priceRange: "€1,300 – €1,550",
    priceInclVat: "€1,573 – €1,876 (incl. 21% VAT)",
    leadTime: "7–10 business days",
    revisions: "1 revision cycle included",
    hours: "Base: 15h · Up to +5h if complexity increases",
    bestFor: "Hardware companies, MVP prototyping, simple to medium complexity parts.",
    description:
      "Stop wasting weeks fixing CAD files or guessing how a part should be manufactured. We design it properly from the start so you can request quotes, build prototypes and move to production with confidence.",
    deliverables: [
      {
        title: "CAD Model",
        description: "Clean, fully parametric CAD model ready for manufacturing.",
      },
      {
        title: "Technical Drawings",
        description: "Manufacturing drawings with dimensions, tolerances and material specifications.",
      },
      {
        title: "Design for Manufacturing Report",
        description: "Practical recommendations to reduce machining costs and avoid manufacturing problems.",
      },
      {
        title: "Material Recommendation",
        description: "The right material and manufacturing process for your application.",
      },
    ],
  },
  {
    id: "validated-design",
    name: "Validated Design",
    tagline: "Know your design will work before you spend money manufacturing it.",
    priceRange: "€3,000 – €3,500",
    priceInclVat: "€3,630 – €4,235 (incl. 21% VAT)",
    leadTime: "10–14 business days",
    revisions: "2 revision cycles included",
    hours: "Base: 35h · Up to +10h if complexity increases",
    bestFor: "PyMEs and startups with funding that need structural certainty before production.",
    description:
      "Anyone can design a part that looks good. We prove it will survive the real loads before the first prototype is built. Less risk, fewer redesigns and fewer expensive mistakes.",
    deliverables: [
      {
        title: "Optimized CAD Model",
        description: "Design refined after engineering analysis.",
      },
      {
        title: "Structural Simulation",
        description: "Stress, deformation and safety factor calculated using FEM.",
      },
      {
        title: "Design Optimization",
        description: "Material removed where possible and reinforced where necessary.",
      },
      {
        title: "Technical Drawings",
        description: "Manufacturing documentation ready to send to suppliers.",
      },
      {
        title: "Engineering Report",
        description: "Clear evidence that your design meets its intended requirements.",
      },
    ],
  },
  {
    id: "performance-design",
    name: "Performance Design",
    tagline: "Don't just prove it works. Make it better. Iterative optimization for weight, cost, and reliability.",
    priceRange: "€5,000 – €5,750",
    priceInclVat: "€6,050 – €6,957 (incl. 21% VAT)",
    leadTime: "14–21 business days",
    revisions: "3 revision cycles included",
    hours: "Base: 60h · Up to +15h if complexity increases",
    bestFor: "Fabricantes, technical PyMEs, and well-funded startups needing full documentation.",
    description:
      "Your part already works. Now make it lighter, stronger and cheaper to manufacture. We optimize the design through multiple engineering iterations, so you get the highest performance without unnecessary material or cost.",
    deliverables: [
      {
        title: "Optimized CAD Model",
        description: "Final geometry refined through engineering optimization.",
      },
      {
        title: "Advanced Structural Analysis",
        description: "Static and fatigue simulations under real operating conditions.",
      },
      {
        title: "Iterative Design Optimization",
        description: "Multiple engineering iterations to reduce weight, improve strength and lower manufacturing cost.",
      },
      {
        title: "Technical Drawings",
        description: "Manufacturing drawings ready for production.",
      },
      {
        title: "Material & Manufacturing Specification",
        description: "Recommended material, manufacturing process and finishing requirements.",
      },
      {
        title: "Engineering Validation Reports",
        description: "Complete documentation showing why the final design performs better than the original.",
      },
    ],
  },
];
