// Merge admin-authored overrides (from /api/config, KV-backed) on top of the
// built-in bilingual copy. Pure, no DOM — used by both the build-time prerender
// script and (for live patching) the client. Rules:
//   - string fields: override replaces the base value only if non-empty.
//   - `points` / `items` arrays (about highlights, feature cards): the override
//     array REPLACES the base array wholesale when present and non-empty — no
//     partial/positional merging, so an admin editing 2 of 6 features doesn't
//     have to resend all 6 correctly aligned.
//   - `pricing.tiers[i].features`: replaced per tier index (0 = Free, 1 = Pro),
//     independently, so editing Free's list never touches Pro's.
// Never mutates its inputs.

function str(base, over) {
  return typeof over === 'string' && over.trim() ? over : base;
}

function arr(base, over) {
  return Array.isArray(over) && over.length ? over : base;
}

export function mergeCopy(base, overrides) {
  if (!overrides) return base;
  const o = overrides;
  return {
    ...base,
    hero: {
      ...base.hero,
      title: str(base.hero.title, o.hero?.title),
      sub: str(base.hero.sub, o.hero?.sub),
    },
    about: {
      ...base.about,
      title: str(base.about.title, o.about?.title),
      body: str(base.about.body, o.about?.body),
      points: arr(base.about.points, o.about?.points),
    },
    features: {
      ...base.features,
      title: str(base.features.title, o.features?.title),
      items: arr(base.features.items, o.features?.items),
    },
    pricing: mergePricing(base.pricing, o.pricing),
  };
}

function mergePricing(base, over) {
  let tiers = base.tiers.map((tier, i) => ({
    ...tier,
    features: arr(tier.features, over?.tiers?.[i]?.features),
  }));
  // featured: 'free' | 'pro' — move the highlight badge.
  if (over?.featured === 'free' || over?.featured === 'pro') {
    tiers = tiers.map((t) => ({ ...t, featured: (t.price === '0' ? 'free' : 'pro') === over.featured }));
  }
  // showFree === false — hide the Free tier entirely.
  if (over?.showFree === false) tiers = tiers.filter((t) => t.price !== '0');
  return { ...base, tiers };
}
