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
