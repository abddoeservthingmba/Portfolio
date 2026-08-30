import { describe, expect, it } from 'vitest';
import type { Certification, Experience, SiteSettings } from '@prisma/client';
import { toCertification, toExperience, toSettings } from '../src/services/serializers.js';
import { BUCKET, resolveAssetUrl } from '../src/lib/storage.js';

describe('resolveAssetUrl', () => {
  it('builds a public storage URL from a stored path', () => {
    expect(resolveAssetUrl(BUCKET.images, 'projects/abc.png')).toBe(
      'https://dbmjasavjofnrhwyymwj.supabase.co/storage/v1/object/public/images/projects/abc.png',
    );
  });

  it('returns null for a missing asset so the caller renders its no-image branch', () => {
    expect(resolveAssetUrl(BUCKET.images, null)).toBeNull();
  });

  it('passes an already-absolute URL through untouched', () => {
    const url = 'https://cdn.example.com/a.png';
    expect(resolveAssetUrl(BUCKET.images, url)).toBe(url);
  });

  it('encodes a path segment containing a space', () => {
    expect(resolveAssetUrl(BUCKET.resume, 'my resume.pdf')).toContain('my%20resume.pdf');
  });
});

describe('toExperience', () => {
  const base: Experience = {
    id: 'e1',
    company: 'Acme',
    role: 'Engineer',
    startDate: new Date('2024-06-01T00:00:00Z'),
    endDate: null,
    summary: null,
    displayOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('emits a plain calendar date, not a timestamp', () => {
    expect(toExperience(base).startDate).toBe('2024-06-01');
  });

  it('preserves a null end date, which denotes a current role', () => {
    expect(toExperience(base).endDate).toBeNull();
  });

  it('renders a null summary as an empty string for the UI', () => {
    expect(toExperience(base).summary).toBe('');
  });

  it('does not leak audit timestamps into the response', () => {
    expect(toExperience(base)).not.toHaveProperty('createdAt');
    expect(toExperience(base)).not.toHaveProperty('updatedAt');
  });
});

describe('toCertification', () => {
  it('does not leak the internal storage path', () => {
    const certification: Certification = {
      id: 'c1',
      title: 'Cert',
      issuer: 'Issuer',
      issueDate: new Date('2025-03-14T00:00:00Z'),
      credentialUrl: null,
      credentialId: null,
      imagePath: 'certificates/secret-name.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toCertification(certification);

    expect(result).not.toHaveProperty('imagePath');
    expect(result.imageUrl).toContain('/certificates/');
    expect(result.issueDate).toBe('2025-03-14');
  });
});

describe('toSettings', () => {
  const base: SiteSettings = {
    id: 's1',
    siteTitle: 'Portfolio',
    tagline: null,
    bio: null,
    emailPublic: null,
    location: null,
    socialLinks: [],
    updatedAt: new Date(),
  };

  it('keeps well-formed social links', () => {
    const result = toSettings({
      ...base,
      socialLinks: [{ label: 'GitHub', url: 'https://github.com/x' }],
    });

    expect(result.socialLinks).toHaveLength(1);
  });

  it('drops malformed entries rather than trusting the JSON column', () => {
    const result = toSettings({
      ...base,
      // A JSON column holds whatever was written to it.
      socialLinks: [{ label: 'GitHub' }, 'nonsense', null, { url: 'https://x.com' }] as never,
    });

    expect(result.socialLinks).toEqual([]);
  });

  it('survives a non-array value in the JSON column', () => {
    const result = toSettings({ ...base, socialLinks: { oops: true } as never });
    expect(result.socialLinks).toEqual([]);
  });
});
