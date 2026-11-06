/*
 * Social proof for the marketing site: numbers and customer quotes.
 *
 * The design SKILL forbids invented stats and testimonials. Every value below is a
 * marked placeholder until the team supplies a real figure or a quote it has
 * permission to publish. A block renders only once all of its values are filled in,
 * so placeholders never reach the live site.
 *
 * To publish: replace the `{{…}}` string with the real value.
 */

export type Stat = { value: string; label: string };
export type Testimonial = { quote: string; name: string; role: string; project: string };

export const STATS: Stat[] = [
  { value: '{{orders_delivered}}', label: 'Orders delivered' },
  { value: '{{active_mechmasters}}', label: 'Active MechMasters' },
  { value: '{{repeat_customers}}', label: 'Repeat customers' },
];

// Example shape: { quote: 'Our chassis plates arrived…', name: 'Aarav Mehta', role: 'Captain, Team Vyom Robotics', project: 'Robotics prototype' }
export const TESTIMONIALS: Testimonial[] = [
  { quote: '{{testimonial}}', name: '{{customer_name}}', role: '{{customer_role}}', project: '{{project_type}}' },
  { quote: '{{testimonial}}', name: '{{customer_name}}', role: '{{customer_role}}', project: '{{project_type}}' },
  { quote: '{{testimonial}}', name: '{{customer_name}}', role: '{{customer_role}}', project: '{{project_type}}' },
];

const isFilled = (value: string) => !value.includes('{{');

export const publishedStats = STATS.filter((s) => isFilled(s.value));
export const publishedTestimonials = TESTIMONIALS.filter((t) =>
  [t.quote, t.name, t.role, t.project].every(isFilled)
);
