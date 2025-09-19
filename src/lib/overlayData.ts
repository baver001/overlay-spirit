
export interface OverlayItem {
  id: string;
  name: string;
  type: 'css' | 'image';
  value: string;
}

export interface OverlaySet {
  id: string;
  name: string;
  items: OverlayItem[];
}

export interface OverlayCategory {
  id: string;
  name: string;
  sets: OverlaySet[];
}

const createTestOverlays = (baseName: string, count: number, type: 'css' | 'image', values: string[]) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${baseName}-${i + 1}`,
    name: `${baseName} ${i + 1}`,
    type,
    value: values[i % values.length]
  }));
};

export const overlayCategories: OverlayCategory[] = [
  {
    id: 'optical',
    name: 'Optical',
    sets: [
      {
        id: 'light-leaks',
        name: 'Light Leaks',
        items: createTestOverlays('Light Leak', 15, 'css', [
          'radial-gradient(circle at 10% 10%, rgba(255,223,186,0.5) 0%, rgba(255,223,186,0) 25%)',
          'radial-gradient(circle at 90% 90%, rgba(137,207,240,0.4) 0%, rgba(137,207,240,0) 30%)',
          'linear-gradient(45deg, rgba(255,0,0,0.3), rgba(255,154,0,0.3), rgba(208,222,33,0.3))',
          'radial-gradient(ellipse at 70% 30%, rgba(255,165,0,0.4) 0%, rgba(255,69,0,0.2) 50%, transparent 70%)'
        ])
      },
      {
        id: 'lens-flares',
        name: 'Lens Flares',
        items: createTestOverlays('Lens Flare', 15, 'image', [
          '/lovable-uploads/bc5f3f4e-eca3-4ad1-82cb-6b437acc792f.png',
          '/lovable-uploads/7d0a13e2-52ce-439f-a54a-c761d802a728.png'
        ])
      },
      {
        id: 'chromatic',
        name: 'Chromatic',
        items: createTestOverlays('Chromatic', 15, 'css', [
          'linear-gradient(90deg, rgba(255,0,255,0.3) 0%, rgba(0,255,255,0.3) 100%)',
          'radial-gradient(circle, rgba(255,0,0,0.2) 0%, rgba(0,255,0,0.2) 50%, rgba(0,0,255,0.2) 100%)'
        ])
      },
      {
        id: 'rainbow',
        name: 'Rainbow',
        items: createTestOverlays('Rainbow', 15, 'css', [
          'linear-gradient(45deg, rgba(255,0,0,0.3), rgba(255,154,0,0.3), rgba(208,222,33,0.3), rgba(79,220,74,0.3))',
          'conic-gradient(from 0deg, rgba(255,0,0,0.3), rgba(255,154,0,0.3), rgba(208,222,33,0.3))'
        ])
      },
      {
        id: 'prism',
        name: 'Prism',
        items: createTestOverlays('Prism', 15, 'css', [
          'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.3) 100%)',
          'radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 60%)'
        ])
      }
    ]
  },
  {
    id: 'vintage',
    name: 'Vintage',
    sets: [
      {
        id: 'film-grain',
        name: 'Film Grain',
        items: createTestOverlays('Film Grain', 15, 'css', [
          'linear-gradient(rgba(112, 66, 20, 0.2), rgba(112, 66, 20, 0.2))',
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.02), rgba(255,255,255,0.02) 1px, transparent 1px, transparent 10px)',
          'repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.03) 1deg, transparent 2deg)'
        ])
      },
      {
        id: 'sepia-tones',
        name: 'Sepia Tones',
        items: createTestOverlays('Sepia', 15, 'css', [
          'radial-gradient(ellipse at center, rgba(255,204,119,0.3) 0%, rgba(139,69,19,0.2) 50%, rgba(0,0,0,0.1) 100%)',
          'linear-gradient(to bottom, rgba(255,240,165,0.3) 0%, rgba(160,82,45,0.3) 100%)'
        ])
      },
      {
        id: 'old-paper',
        name: 'Old Paper',
        items: createTestOverlays('Old Paper', 15, 'css', [
          'radial-gradient(circle at 50% 50%, rgba(245,222,179,0.4) 0%, rgba(210,180,140,0.6) 100%)',
          'linear-gradient(45deg, rgba(222,184,135,0.3) 0%, rgba(160,82,45,0.3) 100%)'
        ])
      },
      {
        id: 'scratches',
        name: 'Scratches',
        items: createTestOverlays('Scratch', 15, 'css', [
          'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 6px)'
        ])
      },
      {
        id: 'dust',
        name: 'Dust',
        items: createTestOverlays('Dust', 15, 'css', [
          'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 1px, transparent 1px)',
          'radial-gradient(circle at 80% 70%, rgba(0,0,0,0.1) 1px, transparent 1px)'
        ])
      }
    ]
  },
  {
    id: 'futuristic',
    name: 'Futuristic',
    sets: [
      {
        id: 'neon-frames',
        name: 'Neon Frames',
        items: createTestOverlays('Neon Frame', 15, 'image', [
          '/lovable-uploads/6b923094-b1d8-4ab0-816f-5bfc60afb2cd.png',
          '/lovable-uploads/d6c942cc-be41-4ab0-8ee3-cd331fb2bf28.png'
        ])
      },
      {
        id: 'cyber-grids',
        name: 'Cyber Grids',
        items: createTestOverlays('Cyber Grid', 15, 'css', [
          'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,255,255,0.3) 20px, rgba(0,255,255,0.3) 21px)',
          'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,0,255,0.3) 20px, rgba(255,0,255,0.3) 21px)'
        ])
      },
      {
        id: 'holograms',
        name: 'Holograms',
        items: createTestOverlays('Hologram', 15, 'css', [
          'linear-gradient(45deg, rgba(0,255,255,0.3) 0%, rgba(255,0,255,0.3) 50%, rgba(0,255,255,0.3) 100%)',
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 2px, transparent 2px, transparent 10px)'
        ])
      },
      {
        id: 'glitch',
        name: 'Glitch',
        items: createTestOverlays('Glitch', 15, 'image', [
          '/lovable-uploads/b9c79188-0762-4157-9db4-2892d07ca3e8.png',
          '/lovable-uploads/851866d4-3fb4-400e-ab03-c79790dace87.png'
        ])
      },
      {
        id: 'scanlines',
        name: 'Scanlines',
        items: createTestOverlays('Scanline', 15, 'css', [
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)',
          'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)'
        ])
      }
    ]
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    sets: [
      {
        id: 'mystical-lights',
        name: 'Mystical Lights',
        items: createTestOverlays('Mystical Light', 15, 'image', [
          '/lovable-uploads/464b209a-1219-4e42-8140-548fda9c1931.png',
          '/lovable-uploads/1846feda-0e62-44a1-a146-061c6e391956.png',
          '/lovable-uploads/41bc44e2-e121-4e5d-a030-994777da0614.png'
        ])
      },
      {
        id: 'cosmic-waves',
        name: 'Cosmic Waves',
        items: createTestOverlays('Cosmic Wave', 15, 'image', [
          '/lovable-uploads/ab511adf-32ae-4068-aa6e-87fb130ff3c1.png',
          '/lovable-uploads/9ecfc783-8dc7-4d36-95f0-52880da95b06.png'
        ])
      },
      {
        id: 'magic-sparkles',
        name: 'Magic Sparkles',
        items: createTestOverlays('Magic Sparkle', 15, 'css', [
          'radial-gradient(circle at 20% 30%, rgba(255,215,0,0.6) 2px, transparent 2px)',
          'radial-gradient(circle at 80% 70%, rgba(255,255,255,0.8) 1px, transparent 1px)'
        ])
      },
      {
        id: 'ethereal-mist',
        name: 'Ethereal Mist',
        items: createTestOverlays('Ethereal Mist', 15, 'css', [
          'radial-gradient(ellipse at 30% 60%, rgba(138,43,226,0.3) 0%, transparent 70%)',
          'radial-gradient(ellipse at 70% 40%, rgba(72,61,139,0.3) 0%, transparent 70%)'
        ])
      },
      {
        id: 'aurora',
        name: 'Aurora',
        items: createTestOverlays('Aurora', 15, 'css', [
          'linear-gradient(45deg, rgba(0,255,127,0.3) 0%, rgba(64,224,208,0.3) 50%, rgba(147,112,219,0.3) 100%)',
          'radial-gradient(ellipse at 50% 0%, rgba(0,191,255,0.4) 0%, rgba(138,43,226,0.4) 50%, transparent 100%)'
        ])
      }
    ]
  },
  {
    id: 'nature',
    name: 'Nature',
    sets: [
      {
        id: 'sunbeams',
        name: 'Sunbeams',
        items: createTestOverlays('Sunbeam', 15, 'css', [
          'conic-gradient(from 0deg at 50% 0%, transparent 0deg, rgba(255,255,0,0.3) 10deg, transparent 20deg)',
          'radial-gradient(ellipse at 50% 0%, rgba(255,223,0,0.4) 0%, transparent 60%)'
        ])
      },
      {
        id: 'water-drops',
        name: 'Water Drops',
        items: createTestOverlays('Water Drop', 15, 'css', [
          'radial-gradient(circle at 30% 30%, rgba(173,216,230,0.6) 3px, transparent 3px)',
          'radial-gradient(circle at 70% 60%, rgba(135,206,250,0.5) 4px, transparent 4px)'
        ])
      },
      {
        id: 'snow',
        name: 'Snow',
        items: createTestOverlays('Snow', 15, 'css', [
          'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.8) 1px, transparent 1px)',
          'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.6) 2px, transparent 2px)'
        ])
      },
      {
        id: 'fog',
        name: 'Fog',
        items: createTestOverlays('Fog', 15, 'css', [
          'radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          'linear-gradient(to top, rgba(220,220,220,0.3) 0%, transparent 50%)'
        ])
      },
      {
        id: 'leaves',
        name: 'Leaves',
        items: createTestOverlays('Leaf', 15, 'css', [
          'radial-gradient(ellipse at 40% 60%, rgba(34,139,34,0.3) 0%, transparent 40%)',
          'radial-gradient(ellipse at 70% 30%, rgba(107,142,35,0.3) 0%, transparent 40%)'
        ])
      }
    ]
  }
];
