-- Seed data for overlay catalog
-- Categories and draft sets (to be filled with real overlays later)

-- ==========================================
-- CLEAR OLD DATA
-- ==========================================
DELETE FROM overlays;
DELETE FROM overlay_sets;
DELETE FROM categories;

-- ==========================================
-- CATEGORIES (21 categories, underwater merged into nature)
-- ==========================================

INSERT INTO categories (id, slug, name, order_index, created_at, updated_at) VALUES
  ('cat-bokeh', 'bokeh', 'Bokeh', 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-film-leaks', 'film-leaks', 'Film Leaks', 2, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-golden-light', 'golden-light', 'Golden Light', 3, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-prism', 'prism', 'Prism', 4, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-light-rays', 'light-rays', 'Light Rays', 5, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-holographic', 'holographic', 'Holographic', 6, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-neon', 'neon', 'Neon', 7, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-smoke', 'smoke', 'Smoke', 8, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-weather', 'weather', 'Weather', 9, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-shadows', 'shadows', 'Shadows', 10, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-paper', 'paper', 'Paper', 11, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-plastic', 'plastic', 'Plastic', 12, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-grunge', 'grunge', 'Grunge', 13, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-space', 'space', 'Space', 14, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-nature', 'nature', 'Nature', 15, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-glass', 'glass', 'Glass', 16, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-glitch', 'glitch', 'Glitch', 17, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-frames', 'frames', 'Frames', 18, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-ethereal', 'ethereal', 'Ethereal', 19, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-hearts', 'hearts', 'Hearts', 20, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('cat-events', 'events', 'Events', 21, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- ==========================================
-- OVERLAY SETS
-- ==========================================

-- BOKEH Category (8 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-elegance-bokeh', 'Elegance Bokeh', 'cat-bokeh', 'Elegant bokeh light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-add-bokeh', 'Add Bokeh', 'cat-bokeh', 'Simple bokeh overlays to enhance photos', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-golden-bokeh', 'Golden Bokeh', 'cat-bokeh', 'Warm golden bokeh lights', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-rainbow-bokeh', 'Rainbow Bokeh', 'cat-bokeh', 'Colorful rainbow bokeh effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-sparkling-bokeh', 'Sparkling Bokeh', 'cat-bokeh', 'Sparkling light bokeh effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-grand-vintage-bokeh', 'Grand Vintage Bokeh', 'cat-bokeh', 'Vintage style bokeh overlays', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-christmas-bokeh', 'Christmas Bokeh', 'cat-bokeh', 'Festive Christmas bokeh lights', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-prism-light-bokeh', 'Prism Light Bokeh', 'cat-bokeh', 'Prismatic bokeh light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- FILM LEAKS Category (7 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-vintage-light-leaks', 'Vintage Light Leaks', 'cat-film-leaks', 'Classic vintage light leak effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-color-film-burn', 'Color Film Burn', 'cat-film-leaks', 'Colorful film burn overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-film-burn-grain', 'Film Burn Grain', 'cat-film-leaks', 'Film burn with grain texture', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-film-light-leaks', 'Film Light Leaks', 'cat-film-leaks', 'Authentic film light leak effects', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-vintage-film-texture', 'Vintage Film Texture', 'cat-film-leaks', 'Vintage film texture overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-old-photo-film', 'Old Photo Film', 'cat-film-leaks', 'Aged photo film effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-film-dust-flares', 'Film Dust Flares', 'cat-film-leaks', 'Film dust and flare effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- GOLDEN LIGHT Category (11 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-sun-is-shining', 'Sun Is Shining', 'cat-golden-light', 'Bright sunny light overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-golden-hour', 'Golden Hour', 'cat-golden-light', 'Golden hour lighting effects', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-dusted-sun-flares', 'Dusted Sun Flares', 'cat-golden-light', 'Dusty sun flare overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-golden-optical', 'Golden Optical', 'cat-golden-light', 'Golden optical light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-golden-sun-flare-1', 'Golden Sun Flare I', 'cat-golden-light', 'Golden sun flare collection part 1', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-golden-sun-flare-2', 'Golden Sun Flare II', 'cat-golden-light', 'Golden sun flare collection part 2', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-opulent-amber-light', 'Opulent Amber Light', 'cat-golden-light', 'Rich amber light overlays', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-dusted-film-colors', 'Dusted Film Colors', 'cat-golden-light', 'Dusty film color overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-dusted-rose', 'Dusted Rose', 'cat-golden-light', 'Dusty rose light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-dusted-lavender', 'Dusted Lavender', 'cat-golden-light', 'Dusty lavender light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-nostalgy-light', 'Nostalgy Light', 'cat-golden-light', 'Nostalgic light overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- PRISM Category (7 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-prism-rainbow', 'Prism Rainbow', 'cat-prism', 'Rainbow prism light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-crystal-prism', 'Crystal Prism', 'cat-prism', 'Crystal prism refraction overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-prism-diffraction', 'Prism Diffraction', 'cat-prism', 'Prism light diffraction effects', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-rainbow-prism', 'Rainbow Prism', 'cat-prism', 'Colorful rainbow prism overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-prismatic-diffraction', 'Prismatic Diffraction', 'cat-prism', 'Prismatic light diffraction', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-kaleidoscopic-streams', 'Kaleidoscopic Streams', 'cat-prism', 'Kaleidoscope light stream effects', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-glitter-rainbow-glow', 'Glitter Rainbow Glow', 'cat-prism', 'Glittery rainbow glow overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- LIGHT RAYS Category (5 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-color-dynamic-lights', 'Color Dynamic Lights', 'cat-light-rays', 'Dynamic colorful light rays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-chromatic-color-light', 'Chromatic Color Light', 'cat-light-rays', 'Chromatic aberration light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-crystal-light', 'Crystal Light', 'cat-light-rays', 'Crystal light ray overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-light-rays', 'Light Rays', 'cat-light-rays', 'Classic light ray effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-light-trails', 'Light Trails', 'cat-light-rays', 'Light trail overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- HOLOGRAPHIC Category (5 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-optical-flare', 'Optical Flare', 'cat-holographic', 'Optical flare effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-optical-hologram', 'Optical Hologram', 'cat-holographic', 'Holographic optical effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-holographic-plasma', 'Holographic Plasma', 'cat-holographic', 'Plasma holographic overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-holographic-mandala', 'Holographic Mandala', 'cat-holographic', 'Mandala holographic patterns', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-holographic-lights', 'Holographic Lights', 'cat-holographic', 'Holographic light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- NEON Category (7 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-neon-trails', 'Neon Trails', 'cat-neon', 'Neon light trail effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-neon-frames', 'Neon Frames', 'cat-neon', 'Neon frame overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-neon-aesthetic', 'Neon Aesthetic', 'cat-neon', 'Neon aesthetic light effects', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-cyber-aesthetic', 'Cyber Aesthetic', 'cat-neon', 'Cyberpunk aesthetic overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-cyber-neon', 'Cyber Neon', 'cat-neon', 'Cyber neon light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-electric-lightning', 'Electric Lightning', 'cat-neon', 'Electric lightning overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-neon-smoke-frames', 'Neon Smoke Frames', 'cat-neon', 'Neon frames with smoke effects', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- SMOKE Category (6 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-4k-noire-smoke', '4K Noire Smoke', 'cat-smoke', 'High quality noir smoke overlays', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-realistic-smoke', 'Realistic Smoke', 'cat-smoke', 'Realistic smoke effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-smoke-frames', 'Smoke Frames', 'cat-smoke', 'Smoke frame overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-smoke-round-frames', 'Smoke Round Frames', 'cat-smoke', 'Round smoke frame effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-smoke-dust', 'Smoke Dust', 'cat-smoke', 'Smoke with dust particles', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-smoke-and-dust', 'Smoke and Dust', 'cat-smoke', 'Combined smoke and dust overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- WEATHER Category (3 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-fog-mist', 'Fog Mist', 'cat-weather', 'Fog and mist overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-rain-effect', 'Rain Effect', 'cat-weather', 'Rain effect overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-snow-dust', 'Snow Dust', 'cat-weather', 'Snow dust particle overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- SHADOWS Category (3 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-leaf-shadows', 'Leaf Shadows', 'cat-shadows', 'Natural leaf shadow overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-organic-shadows', 'Organic Shadows', 'cat-shadows', 'Organic shadow patterns', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-window-shadows', 'Window Shadows', 'cat-shadows', 'Window light and shadow effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- PAPER Category (8 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-paper-texture', 'Paper Texture', 'cat-paper', 'Paper texture overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-aged-paper', 'Aged Paper', 'cat-paper', 'Aged paper texture effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-old-edges', 'Old Edges', 'cat-paper', 'Vintage old edge overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-old-photo-paper', 'Old Photo Paper', 'cat-paper', 'Old photo paper textures', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-olden-paper-charm', 'Olden Paper Charm', 'cat-paper', 'Charming old paper effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-ripped-paper-edge', 'Ripped Paper Edge', 'cat-paper', 'Ripped paper edge overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-torn-paper', 'Torn Paper', 'cat-paper', 'Torn paper texture overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-junk-journal-floral', 'Junk Journal Floral', 'cat-paper', 'Floral junk journal elements', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- PLASTIC Category (5 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-plastic-wrap', 'Plastic Wrap', 'cat-plastic', 'Plastic wrap texture overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-plastic-package-wrap', 'Plastic Package Wrap', 'cat-plastic', 'Package plastic wrap effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-cellophane-texture', 'Cellophane Texture', 'cat-plastic', 'Cellophane texture overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-holo-scratch-wrap', 'Holo Scratch Wrap', 'cat-plastic', 'Holographic scratched wrap', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-iridescent-cellophane', 'Iridescent Cellophane', 'cat-plastic', 'Iridescent cellophane effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- GRUNGE Category (2 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-grunge-dust-scratches', 'Grunge Dust Scratches', 'cat-grunge', 'Grunge dust and scratch overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-crystal-bokeh-dust', 'Crystal Bokeh Dust', 'cat-grunge', 'Crystal bokeh with dust effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- SPACE Category (4 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-night-sky', 'Night Sky', 'cat-space', 'Night sky overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-night-sky-starry', 'Night Sky Starry', 'cat-space', 'Starry night sky effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-galaxy-nebula', 'Galaxy Nebula', 'cat-space', 'Galaxy and nebula overlays', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-aurora-borealis', 'Aurora Borealis', 'cat-space', 'Northern lights aurora effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- NATURE Category (6 sets - includes underwater)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-underwater-lights', 'Underwater Lights', 'cat-nature', 'Underwater light effects', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-underwater-effect', 'Underwater Effect', 'cat-nature', 'Underwater caustic effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-big-butterflies', 'Big Butterflies', 'cat-nature', 'Large butterfly overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-botanical-xray', 'Botanical X-Ray', 'cat-nature', 'X-ray botanical overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-abstract-soap-bubbles', 'Abstract Soap Bubbles', 'cat-nature', 'Abstract soap bubble effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-dream-bubbles', 'Dream Bubbles', 'cat-nature', 'Dreamy bubble overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- GLASS Category (3 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-shattered-glass', 'Shattered Glass', 'cat-glass', 'Shattered glass overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-broken-glass', 'Broken Glass', 'cat-glass', 'Broken glass texture effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-broken-glass-grand', 'Broken Glass Grand', 'cat-glass', 'Grand broken glass collection', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- GLITCH Category (2 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-digital-glitch-frames', 'Digital Glitch Frames', 'cat-glitch', 'Digital glitch frame effects', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-glitch-printer', 'Glitch Printer', 'cat-glitch', 'Printer glitch overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- FRAMES Category (4 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-chromatic-frames', 'Chromatic Frames', 'cat-frames', 'Chromatic aberration frames', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-fantasy-glow-frames', 'Fantasy Glow Frames', 'cat-frames', 'Fantasy glowing frame overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-aged-gold-border', 'Aged Gold Border', 'cat-frames', 'Aged gold border frames', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-dance-portal', 'Dance Portal', 'cat-frames', 'Dynamic portal frame effects', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- ETHEREAL Category (4 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-ethereal-holiday-sparkles', 'Ethereal Holiday Sparkles', 'cat-ethereal', 'Holiday sparkle overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-ethereal-atmospheric-lights', 'Ethereal Atmospheric Lights', 'cat-ethereal', 'Atmospheric light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-ethereal-dreams', 'Ethereal Dreams', 'cat-ethereal', 'Dreamy ethereal overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-star-shine', 'Star Shine', 'cat-ethereal', 'Star shine light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- HEARTS Category (2 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-heart-glow', 'Heart Glow', 'cat-hearts', 'Glowing heart overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-glowing-hearts', 'Glowing Hearts', 'cat-hearts', 'Heart with glow effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- EVENTS Category (9 sets)
INSERT INTO overlay_sets (id, title, category_id, description, is_paid, price_cents, is_active, created_at, updated_at) VALUES
  ('set-summer-time', 'Summer Time', 'cat-events', 'Summer themed overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-beach-party', 'Beach Party', 'cat-events', 'Beach party themed effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-halloween-smoke', 'Halloween Smoke', 'cat-events', 'Halloween smoke overlays', 0, NULL, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-creepy-ghosts', 'Creepy Ghosts', 'cat-events', 'Creepy ghost overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-fire-burning', 'Fire Burning', 'cat-events', 'Fire and flame effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-fireworks', 'Fireworks', 'cat-events', 'Fireworks celebration overlays', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-party-lights', 'Party Lights', 'cat-events', 'Party light effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-wedding-tulle', 'Wedding Tulle', 'cat-events', 'Elegant wedding tulle overlays', 1, 599, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('set-party-magic', 'Party Magic', 'cat-events', 'Magical party effects', 1, 499, 1, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);
