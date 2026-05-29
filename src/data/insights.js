export const insightCategories = [
  { id: 'all', label: 'All' },
  { id: 'Voice AI', label: 'Voice AI' },
  { id: 'Partnerships', label: 'Partnerships' },
  { id: 'Personal', label: 'Personal' },
];

export const insights = [
  {
    slug: 'no-technical-background-built-roi-calculator',
    title:
      'I Have No Technical Background. I Built an AI-Powered ROI Calculator Anyway.',
    date: '2026-05-28',
    category: 'Voice AI',
    excerpt:
      "For most of my career, I had ideas I couldn't build. AI changed that. Here's what I made.",
    content: `
For most of my career, I've had ideas that I couldn't build.

I'd be in a partner meeting, walking through a deck, and think — this would be so much more compelling if I could just show them the math live. Or I'd be prepping for a QBR and wish I had a tool that could model out growth scenarios on the fly instead of a static spreadsheet someone else built.

But I'm not an engineer. I never have been. I came up through sales and partnerships — Vonage, Talkdesk, and now Deepgram — closing deals, building partner programs, and running GTM motions. Writing code was never part of the job description.

That changed this year.

## What I Built

Over the past few weeks I built two tools that I now use in real sales and partner conversations:

A Partnership Proposal Generator that takes a company name, industry, and use case and produces a structured customer proposal in seconds — complete with value proposition, deal structure, and next steps.

And a Deepgram ROI Calculator — a three-step wizard where a contact center can input their agent count, call volume, handle time, and goals, and get back a projected annual value from deploying Deepgram. The math is benchmarked against real industry data: Gartner, BCG, and published contact center research. The output includes an auto-recommended Deepgram solution stack based on the outcomes they care about.

Both tools are live at kriskorich.com.

## How I Built Them

I used Claude Code — Anthropic's agentic coding tool — to scaffold, build, and iterate everything. I can't write React. I don't know Tailwind CSS. But I can describe exactly what I want, why it matters, and what the output should look like. It turns out that's enough.

The ROI Calculator took a few sessions. The math needed to be right — conservative, defensible, sourced. The product recommendation logic needed to reflect how Deepgram actually sells: Flux for streaming use cases, Nova-3 Batch for post-call processing, Voice Agent API when self-service deflection is the goal. Getting those details right required domain knowledge, not engineering knowledge.

That's the insight I keep coming back to.

## What This Means for People Like Me

There's a whole generation of sales, partnerships, and GTM professionals who have deep domain expertise and zero technical output to show for it. We know the products, the buyers, the objections, the competitive landscape. We know what a good ROI story looks like and what a bad one sounds like from a mile away.

AI hasn't just given us a shortcut. It's given us a way to externalize expertise that previously lived only in decks and conversations.

I'm not trying to become an engineer. I'm trying to become a better version of what I already am — someone who understands the business and can now build things that prove it.

This portfolio is a work in progress. More tools coming.
`,
  },
  {
    slug: 'deepgram-ibm-advanced-voice-enterprise-ai',
    title:
      'Deepgram and IBM Introduce Advanced Voice Capabilities for Enterprise AI',
    date: '2025-05-01',
    category: 'Partnerships',
    excerpt:
      "Deepgram becomes IBM's first voice partner, offering fast, reliable, and scalable transcription and speech technology for enterprise AI.",
    external: true,
    externalUrl:
      'https://deepgram.com/learn/deepgram-and-ibm-introduce-advanced-voice-capabilities-for-enterprise-ai',
  },
  {
    slug: 'banking-voice-cx-speed-trust-scale',
    title:
      "Banking's Next Front Door Is Voice: How CX Leaders Are Rewiring Service for Speed, Trust, and Scale",
    date: '2025-04-01',
    category: 'Voice AI',
    excerpt:
      "Banking has always been about trust — but customer expectations are shifting fast. Here's how voice AI is solving the speed vs. security tradeoff.",
    external: true,
    externalUrl:
      'https://deepgram.com/learn/banking-next-front-door-is-voice-how-cx-leaders-are-rewiring-service-for-speed',
  },
  {
    slug: 'voice-ai-ecommerce-personal-shopper',
    title:
      'Your Personal Shopper, Reimagined: The Rise of Voice AI in E-Commerce',
    date: '2025-03-15',
    category: 'Voice AI',
    excerpt:
      "Voice AI is transforming how customers shop online — from product discovery to checkout. Here's what the next generation of retail experience looks like.",
    external: true,
    externalUrl:
      'https://deepgram.com/learn/your-personal-shopper-reimagined-the-rise-of-voice-ai-in-e-commerce',
  },
  {
    slug: 'voice-ai-airline-experience',
    title:
      'Turbulence-Free Service: How Voice AI Is Redefining the Airline Experience',
    date: '2025-03-01',
    category: 'Voice AI',
    excerpt:
      "From rebooking disrupted flights to personalizing in-flight service, voice AI is becoming the airline industry's most valuable customer experience tool.",
    external: true,
    externalUrl:
      'https://deepgram.com/learn/turbulence-free-service-how-voice-ai-is-redefining-the-airline-experience',
  },
  {
    slug: 'voice-ai-utilities-cx',
    title: 'How Voice AI Can Transform Utilities: Powering Up CX',
    date: '2025-02-15',
    category: 'Voice AI',
    excerpt:
      'Utility companies face some of the highest call volumes in any industry. Voice AI is helping them meet demand without sacrificing service quality.',
    external: true,
    externalUrl:
      'https://deepgram.com/learn/how-voice-ai-can-transform-utilities-powering-up-cx',
  },
  {
    slug: 'voice-ai-insurance-claims',
    title: 'The Future of Claims and Insurance Through Voice AI',
    date: '2025-02-01',
    category: 'Voice AI',
    excerpt:
      'Claims processing is one of the most friction-heavy experiences in financial services. Voice AI is changing that — faster resolutions, better accuracy, less frustration.',
    external: true,
    externalUrl:
      'https://deepgram.com/learn/the-future-of-claims-and-insurance-through-voice-ai',
  },
  {
    slug: 'voice-ai-public-services-trust',
    title: 'Rebuilding Trust in Public Services with Voice AI',
    date: '2025-01-15',
    category: 'Voice AI',
    excerpt:
      'Government and public sector organizations are under pressure to do more with less. Voice AI offers a path to faster, more accessible citizen services.',
    external: true,
    externalUrl:
      'https://deepgram.com/learn/rebuilding-trust-in-public-services-with-voice-ai',
  },
  {
    slug: 'voice-ai-quick-service-restaurants',
    title: 'Voice AI in Quick Service Restaurants',
    date: '2025-01-01',
    category: 'Voice AI',
    excerpt:
      'Drive-throughs, order kiosks, and customer service lines — voice AI is becoming the backbone of the QSR experience.',
    external: true,
    externalUrl:
      'https://deepgram.com/learn/voice-ai-in-quick-service-restaurants',
  },
  {
    slug: 'voice-ai-hospitality-concierge',
    title:
      'AI Concierge Redefines Hospitality and Customer Loyalty Worldwide',
    date: '2024-12-01',
    category: 'Voice AI',
    excerpt:
      'The best hospitality experiences feel personal and effortless. Voice AI is making that possible at scale — from check-in to concierge to loyalty programs.',
    external: true,
    externalUrl:
      'https://deepgram.com/learn/ai-concierge-redefines-hospitality-and-customer-loyalty-worldwide',
  },
  {
    slug: 'talkdesk-cognizant-alliance',
    title:
      'Talkdesk and Cognizant Team Up to Accelerate AI-Powered Customer Experience',
    date: '2023-06-01',
    category: 'Partnerships',
    excerpt:
      'Talkdesk and Cognizant formed a strategic alliance to help enterprises accelerate AI-powered CX transformation at scale.',
    external: true,
    externalUrl:
      'https://www.talkdesk.com/news-and-press/press-releases/cognizant-alliance/',
  },
  {
    slug: 'talkdesk-aws-patient-care',
    title:
      "Enhancing Patient Care with Talkdesk's AI-Powered Contact Center",
    date: '2025-01-10',
    category: 'Partnerships',
    excerpt:
      "Published on the AWS Partner Network blog — how Talkdesk's AI-powered contact center is improving patient care and healthcare CX.",
    external: true,
    externalUrl:
      'https://aws.amazon.com/blogs/apn/enhancing-patient-care-with-talkdesks-ai-powered-contact-center/',
  },
  {
    slug: 'talkdesk-fedramp-authorization',
    title:
      'Talkdesk Achieves Full FedRAMP Authorization for CX Cloud Government Edition',
    date: '2023-04-01',
    category: 'Partnerships',
    excerpt:
      'Talkdesk earned full FedRAMP authorization, unlocking AI-powered contact center capabilities for U.S. federal government agencies.',
    external: true,
    externalUrl:
      'https://www.talkdesk.com/news-and-press/press-releases/fedramp-authorization/',
  },
  {
    slug: 'talkdesk-aws-financial-services-competency',
    title: 'Talkdesk Achieves AWS Financial Services ISV Competency',
    date: '2023-03-01',
    category: 'Partnerships',
    excerpt:
      'Talkdesk earned the AWS Financial Services ISV Competency, validating its ability to help financial institutions and insurance companies deliver connected, personalized experiences.',
    external: true,
    externalUrl:
      'https://www.talkdesk.com/news-and-press/press-releases/aws-financial-services-competency/',
  },
  {
    slug: 'talkdesk-aws-healthcare-isv-competency',
    title: 'Talkdesk Achieves AWS Healthcare ISV Competency',
    date: '2023-02-01',
    category: 'Partnerships',
    excerpt:
      'Talkdesk earned the AWS Healthcare ISV Competency, recognizing its work enhancing provider operations and patient experiences on AWS.',
    external: true,
    externalUrl:
      'https://www.talkdesk.com/news-and-press/press-releases/aws-healthcare-isv-competency/',
  },
  {
    slug: 'talkdesk-microsoft-partner-of-year',
    title:
      'Talkdesk Recognized as Microsoft Digital Native 2023 Partner of the Year',
    date: '2023-07-01',
    category: 'Partnerships',
    excerpt:
      "Talkdesk was named Microsoft's Digital Native Partner of the Year, recognizing the depth of the joint go-to-market motion and customer impact.",
    external: true,
    externalUrl:
      'https://www.talkdesk.com/news-and-press/press-releases/talkdesk-microsoft-award/',
  },
  {
    slug: 'talkdesk-epic-pals-2023',
    title:
      "Talkdesk and Epic Enter New Collaboration with the Launch of Epic's Pals Program",
    date: '2023-05-01',
    category: 'Partnerships',
    excerpt:
      "Talkdesk and Epic launched a new collaboration through Epic's Pals program, deepening the integration between healthcare CX and clinical workflows.",
    external: true,
    externalUrl:
      'https://www.talkdesk.com/news-and-press/press-releases/epic-pal-2023/',
  },
];

export function findInsight(slug) {
  return insights.find((p) => p.slug === slug) || null;
}

export function formatInsightDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
