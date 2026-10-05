import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { PandalCard } from './PandalCard';
import { Pandal } from '@pujofy/types';

describe('PandalCard Component', () => {
  const mockPandal: Pandal = {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Sree Bhumi Sporting Club',
    description: 'Famous grand lighting pandal.',
    latitude: 22.5982,
    longitude: 88.3985,
    imageUrl: '/images/pandals/pandal-001.webp',
    imageAlt: 'Festive Durga Puja pandal at Sree Bhumi Sporting Club - Grand Architecture',
    address: 'VIP Road, Lake Town',
    area: 'Lake Town',
    city: 'Kolkata',
    category: 'Grand Architecture',
    estimatedVisitMinutes: 45,
    openingTime: '00:00',
    closingTime: '23:59',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders pandal dynamic imageUrl and imageAlt in compact variant', () => {
    const html = renderToString(<PandalCard pandal={mockPandal} variant="compact" />);
    expect(html).toContain('src="/images/pandals/pandal-001.webp"');
    expect(html).toContain('alt="Festive Durga Puja pandal at Sree Bhumi Sporting Club - Grand Architecture"');
    expect(html).toContain('Sree Bhumi Sporting Club');
    expect(html).toContain('Lake Town');
    expect(html).toContain('loading="lazy"');
  });

  it('falls back to default image and alt text when imageUrl is missing', () => {
    const pandalWithoutImg: Pandal = {
      ...mockPandal,
      imageUrl: undefined,
      imageAlt: undefined,
    };

    const html = renderToString(<PandalCard pandal={pandalWithoutImg} variant="compact" />);
    expect(html).toContain('src="/images/pandals/fallback.webp"');
    expect(html).toContain('alt="Festive Durga Puja pandal at Sree Bhumi Sporting Club"');
  });

  it('renders recommended variant with eager image loading and action buttons', () => {
    const html = renderToString(
      <PandalCard
        pandal={mockPandal}
        variant="recommended"
        explanation="Short walk with low crowd."
        onGoThere={() => {}}
        onNotNow={() => {}}
      />
    );

    expect(html).toContain('src="/images/pandals/pandal-001.webp"');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('GO THERE');
    expect(html).toContain('NOT NOW');
    expect(html).toContain('Short walk with low crowd.');
  });

  it('renders detail variant with large aspect ratio banner', () => {
    const html = renderToString(<PandalCard pandal={mockPandal} variant="detail" />);
    expect(html).toContain('src="/images/pandals/pandal-001.webp"');
    expect(html).toContain('VIP Road, Lake Town');
    expect(html).toContain('Grand Architecture');
  });
});
