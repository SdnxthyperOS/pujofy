import { describe, it, expect } from 'vitest';
import { transformMapboxUrl } from './MapView';

describe('transformMapboxUrl', () => {
  const token = 'test-mapbox-token-123';

  it('should transform standard https mapbox api url with token', () => {
    const url = 'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1';
    const result = transformMapboxUrl(url, token);
    expect(result).toBe('https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1?access_token=test-mapbox-token-123');
  });

  it('should preserve existing access token if present', () => {
    const url = 'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1?access_token=existing';
    const result = transformMapboxUrl(url, token);
    expect(result).toBe(url);
  });

  it('should transform mapbox://styles/ protocol', () => {
    const url = 'mapbox://styles/mapbox/navigation-night-v1';
    const result = transformMapboxUrl(url, token);
    expect(result).toBe('https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1?access_token=test-mapbox-token-123');
  });

  it('should transform mapbox://sprites/ protocol for json and png', () => {
    const spriteJson = 'mapbox://sprites/mapbox/navigation-night-v1.json';
    expect(transformMapboxUrl(spriteJson, token)).toBe(
      'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/sprite.json?access_token=test-mapbox-token-123'
    );

    const sprite2xPng = 'mapbox://sprites/mapbox/navigation-night-v1@2x.png';
    expect(transformMapboxUrl(sprite2xPng, token)).toBe(
      'https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/sprite@2x.png?access_token=test-mapbox-token-123'
    );
  });

  it('should transform mapbox://fonts/ protocol', () => {
    const url = 'mapbox://fonts/mapbox/DIN%20Offc%20Pro%20Medium,Arial%20Unicode%20MS%20Bold/0-255.pbf';
    expect(transformMapboxUrl(url, token)).toBe(
      'https://api.mapbox.com/fonts/v1/mapbox/DIN%20Offc%20Pro%20Medium,Arial%20Unicode%20MS%20Bold/0-255.pbf?access_token=test-mapbox-token-123'
    );
  });

  it('should transform mapbox:// source TileJSON', () => {
    const url = 'mapbox://mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2';
    expect(transformMapboxUrl(url, token)).toBe(
      'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2.json?secure&access_token=test-mapbox-token-123'
    );
  });

  it('should return untouched url if token is missing or empty', () => {
    const url = 'https://basemaps.cartocdn.com/rastertiles/voyager/0/0/0.png';
    expect(transformMapboxUrl(url, '')).toBe(url);
  });
});
