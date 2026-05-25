/**
 * Permission catalog. Mirrors the rows seeded into public.permissions.
 * Adding one is a two-step change: register here AND seed in the next
 * migration.
 */
export const PERMISSIONS = {
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  PRODUCTS_PUBLISH: "products.publish",
  COLLECTIONS_MANAGE: "collections.manage",
  INVENTORY_MANAGE: "inventory.manage",

  ORDERS_VIEW: "orders.view",
  ORDERS_UPDATE: "orders.update",
  ORDERS_REFUND: "orders.refund",
  ORDERS_CANCEL: "orders.cancel",
  ORDERS_EXPORT: "orders.export",

  RETURNS_VIEW: "returns.view",
  RETURNS_DECIDE: "returns.decide",

  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  FUNNELS_VIEW: "funnels.view",
  FUNNELS_CREATE: "funnels.create",
  FUNNELS_UPDATE: "funnels.update",
  FUNNELS_PUBLISH: "funnels.publish",
  FUNNELS_DELETE: "funnels.delete",

  ANALYTICS_VIEW: "analytics.view",
  ANALYTICS_EXPORT: "analytics.export",

  EMPLOYEES_VIEW: "employees.view",
  EMPLOYEES_INVITE: "employees.invite",
  EMPLOYEES_UPDATE: "employees.update",
  EMPLOYEES_REMOVE: "employees.remove",
  ROLES_MANAGE: "roles.manage",

  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",
  INTEGRATIONS_MANAGE: "integrations.manage",

  DISCOUNTS_VIEW: "discounts.view",
  DISCOUNTS_CREATE: "discounts.create",
  DISCOUNTS_UPDATE: "discounts.update",
  DISCOUNTS_DELETE: "discounts.delete",

  LOYALTY_VIEW: "loyalty.view",
  LOYALTY_ADJUST: "loyalty.adjust",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS);
