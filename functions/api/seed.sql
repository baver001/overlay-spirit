-- Minimal seed: one admin, two demo sets

INSERT OR IGNORE INTO users (id, email, password_hash, role, created_at, updated_at)
VALUES
  ('admin-1', 'admin@example.com', '$2a$10$demo_hash_replace', 'admin', strftime('%s','now')*1000, strftime('%s','now')*1000);

INSERT OR IGNORE INTO overlay_sets (id, title, category, description, cover_image_url, is_paid, price_cents, is_active, created_by, created_at, updated_at)
VALUES
  ('set-free-1', 'Free Futuristic', 'futuristic', 'Free sample overlays', NULL, 0, NULL, 1, 'admin-1', strftime('%s','now')*1000, strftime('%s','now')*1000),
  ('set-paid-1', 'Neon Frames Pro', 'futuristic', 'Pro neon frames pack', NULL, 1, 499, 1, 'admin-1', strftime('%s','now')*1000, strftime('%s','now')*1000);


