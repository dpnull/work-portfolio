export const colourStudies = [
  { id: 'current', name: 'Butter & Forest', number: '00', note: 'Your current palette', description: 'Warm butter paper, forest ink and green accents. The starting point for comparison.' },
  { id: 'cobalt', name: 'Chalk & Cobalt', number: '01', note: 'Crisp, expressive, contemporary', description: 'Cool paper and confident blue, with a small citron accent. Connects to the blue hour in your photographs.' },
  { id: 'lilac', name: 'Lilac & Ink', number: '02', note: 'Playful, creative, personal', description: 'Builds on your existing periwinkle. A violet accent and dark plum ink bring more of the creator personality forward.' },
  { id: 'forest', name: 'Fresh Forest', number: '03', note: 'Closest to your current identity', description: 'Keeps your forest green, replaces the yellow cream with cool pale green, and adds a sharper lime accent.' },
  { id: 'oxblood', name: 'Blush & Oxblood', number: '04', note: 'Warm, expressive, editorial', description: 'A soft rose ground, rich wine accents and a little sky blue. Warmer and more intimate, without the yellow cast.' },
  { id: 'midnight', name: 'Midnight & Ice', number: '05', note: 'Cinematic, calm, distinctive', description: 'Dusk navy and icy blue let the photography glow. White photographic prints preserve the handmade feeling.' },
] as const;
export type ColourStudyId = typeof colourStudies[number]['id'];
