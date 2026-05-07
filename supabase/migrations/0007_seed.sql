-- =============================================================================
-- 0007_seed.sql
-- Seed permissions, default staff roles, and gym-specific categories.
-- =============================================================================

insert into public.permissions (key, resource, action, description) values
  ('products.view',       'products',     'view',     'View products and variants'),
  ('products.create',     'products',     'create',   'Create new products'),
  ('products.update',     'products',     'update',   'Edit existing products'),
  ('products.delete',     'products',     'delete',   'Delete products'),
  ('products.publish',    'products',     'publish',  'Publish/unpublish products'),
  ('collections.manage',  'collections',  'manage',   'Manage categories'),
  ('inventory.manage',    'inventory',    'manage',   'Adjust stock levels'),
  ('orders.view',         'orders',       'view',     'View orders'),
  ('orders.update',       'orders',       'update',   'Edit order details + fulfillment'),
  ('orders.refund',       'orders',       'refund',   'Issue refunds'),
  ('orders.cancel',       'orders',       'cancel',   'Cancel orders'),
  ('orders.export',       'orders',       'export',   'Export order CSVs'),
  ('customers.view',      'customers',    'view',     'View customers'),
  ('customers.update',    'customers',    'update',   'Edit customer records'),
  ('customers.delete',    'customers',    'delete',   'Delete customer records'),
  ('funnels.view',        'funnels',      'view',     'View funnels'),
  ('funnels.create',      'funnels',      'create',   'Create funnels'),
  ('funnels.update',      'funnels',      'update',   'Edit funnels'),
  ('funnels.publish',     'funnels',      'publish',  'Publish/unpublish funnels'),
  ('funnels.delete',      'funnels',      'delete',   'Delete funnels'),
  ('analytics.view',      'analytics',    'view',     'View analytics dashboards'),
  ('analytics.export',    'analytics',    'export',   'Export analytics data'),
  ('employees.view',      'employees',    'view',     'View employees'),
  ('employees.invite',    'employees',    'invite',   'Invite new employees'),
  ('employees.update',    'employees',    'update',   'Edit employees / assign roles'),
  ('employees.remove',    'employees',    'remove',   'Remove employees'),
  ('roles.manage',        'roles',        'manage',   'Create and edit custom roles'),
  ('settings.view',       'settings',     'view',     'View store settings'),
  ('settings.update',     'settings',     'update',   'Edit store settings, theme, branding'),
  ('integrations.manage', 'integrations', 'manage',   'Manage integrations + API keys')
on conflict (key) do nothing;

-- Default staff roles (system-protected)
do $$
declare
  r_admin   uuid;
  r_manager uuid;
  r_support uuid;
  r_content uuid;
  r_analyst uuid;
begin
  insert into public.roles (key, name, description, is_system) values
    ('admin', 'Admin', 'Full access to the store', true)
    returning id into r_admin;
  insert into public.roles (key, name, description, is_system) values
    ('store_manager', 'Store Manager', 'Catalog, orders, customers — no team or settings', true)
    returning id into r_manager;
  insert into public.roles (key, name, description, is_system) values
    ('customer_support', 'Customer Support', 'Read orders/customers, process refunds', true)
    returning id into r_support;
  insert into public.roles (key, name, description, is_system) values
    ('content_editor', 'Content Editor', 'Catalog + funnels, no publish', true)
    returning id into r_content;
  insert into public.roles (key, name, description, is_system) values
    ('analyst', 'Analyst', 'Read-only analytics + exports', true)
    returning id into r_analyst;

  -- Admin: every permission
  insert into public.role_permissions (role_id, permission)
    select r_admin, key from public.permissions;

  insert into public.role_permissions (role_id, permission) values
    (r_manager, 'products.view'), (r_manager, 'products.create'), (r_manager, 'products.update'), (r_manager, 'products.publish'),
    (r_manager, 'collections.manage'), (r_manager, 'inventory.manage'),
    (r_manager, 'orders.view'), (r_manager, 'orders.update'), (r_manager, 'orders.refund'), (r_manager, 'orders.cancel'),
    (r_manager, 'customers.view'), (r_manager, 'customers.update'),
    (r_manager, 'analytics.view');

  insert into public.role_permissions (role_id, permission) values
    (r_support, 'orders.view'), (r_support, 'orders.refund'), (r_support, 'orders.cancel'),
    (r_support, 'customers.view'), (r_support, 'customers.update');

  insert into public.role_permissions (role_id, permission) values
    (r_content, 'products.view'), (r_content, 'products.create'), (r_content, 'products.update'),
    (r_content, 'collections.manage'),
    (r_content, 'funnels.view'), (r_content, 'funnels.create'), (r_content, 'funnels.update');

  insert into public.role_permissions (role_id, permission) values
    (r_analyst, 'analytics.view'), (r_analyst, 'analytics.export'), (r_analyst, 'orders.view');
end$$;

-- Gym-flavored top-level categories
insert into public.categories (slug, title, description, sort_order) values
  ('supplements',  'Supplements',  'Whey, creatine, pre-workout, BCAAs, vitamins.', 1),
  ('apparel',      'Apparel',      'Performance gym wear — tees, hoodies, leggings, shorts.', 2),
  ('equipment',    'Equipment',    'Dumbbells, bands, mats, gloves, belts.', 3),
  ('accessories',  'Accessories',  'Shakers, bags, water bottles, wraps.', 4),
  ('programs',     'Programs',     'Digital workout plans and coaching guides.', 5),
  ('shop-by-goal', 'Shop by goal', 'Bulk, cut, performance, recovery.', 6)
on conflict (slug) do nothing;
