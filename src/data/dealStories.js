export const dealStories = [
  {
    slug: 'cold-outreach-to-7m-gsi-partnership',
    title:
      'From Cold Outreach to $7M: How a GSI Partnership Closed the Largest Deal of the Year',
    date: '2026-05-28',
    category: 'Partnerships',
    dealSize: '$7M TCV',
    contractLength: '2 Years',
    industry: 'High Tech',
    motion: 'GSI Partner-Sourced',
    outcome: 'Largest deal of the year',
    excerpt:
      'A $7M partner-sourced deal that started with cold outreach, years of enablement, and a GSI partnership built from scratch.',
    content: `
For most of my career, I've had ideas that I couldn't build.

A high-growth technology company was scaling faster than its customer operations could keep up with. With no CCaaS solution in place, inbound call volume was outpacing headcount. The results were predictable: abandoned calls were rising, there were no self-service options across voice or digital channels, and customer frustration was compounding with every quarter of growth.

They needed a full-stack solution — fast — and decided to run a formal RFP to find it.

## Building the Partnership — Before There Was a Deal

This opportunity didn't come from an inbound lead or a warm referral. It came from a partnership that didn't exist until I built it.

The work started with cold outreach into a global GSI with no prior relationship with us. Getting their attention was step one. Earning their trust was the real job — and that took time, presence, and consistency.

I ran enablement sessions across their sales, delivery, and engineering teams globally — not once, but repeatedly, until our product was something their people could actually position and build on. I traveled to India multiple times to meet their teams in person, build relationships at the ground level, and show that we were a partner worth betting on. Those trips weren't optional. Trust with a global GSI doesn't get built over Zoom.

Beyond enablement, I led account alignment sessions to make sure both organizations were working toward the same goals on the same timeline. I got them onto a certification path so their engineers could develop real internal skills — which translated directly into confidence when positioning us in front of customers. And I managed the entire contracting process across three tracks: reselling, implementation, and managed services. That's three separate agreement structures, each with its own commercial and legal complexity, negotiated and closed before a single deal was ever registered.

By the time this opportunity surfaced, the partnership was real. That's why it worked.

## The Opportunity

When the customer launched their RFP, our partner was already engaged and positioned. But so were other partners — each angling to lead the process and claim the relationship. I had to move quickly to protect the registration, align internally on partner prioritization, and make clear to everyone involved that we were running this deal with one partner, not three.

From there my role shifted to managing the partner through the full sales cycle — setting expectations on their responsibilities, coaching them on how to position the solution, and making sure their recommendation to the customer was grounded in the right technical and commercial story. The AE ran the direct sales motion. I ran the partner.

The sales cycle was long. Navigating an RFP with a large enterprise, multiple stakeholders, and competing partner interests rarely moves quickly. Staying aligned, staying patient, and keeping the partner confident in the outcome was as much the job as anything else.

## The Outcome

The partner's formal recommendation to the customer was our product. The customer signed a 2-year contract and moved forward with a full end-to-end implementation — AI-powered self-service across voice and digital channels, a complete CCaaS deployment, and measurable improvements in AHT, call abandonment rates, and call qualification through self-service containment.

It was the largest deal of the year for the company.

## The Takeaway

Partner-sourced revenue doesn't happen by accident. It's the result of building real relationships before the opportunity exists — through enablement, presence, trust, and operational groundwork that most people never see. Protecting those relationships when things get complicated, and knowing how to manage a partner through a sales cycle the same way you'd manage a deal directly, is what separates a pipeline that performs from one that looks good on paper.

The best GSI partnerships aren't transactional. They're built — and this one was built from zero.
`,
  },
];

export function findDealStory(slug) {
  return dealStories.find((s) => s.slug === slug) || null;
}

export function formatDealStoryDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
