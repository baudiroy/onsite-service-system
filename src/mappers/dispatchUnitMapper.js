function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toDispatchUnitDTO(row) {
  if (!row) return null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    code: row.code,
    serviceRegion: row.service_region,
    status: row.enabled ? 'active' : 'disabled',
    city: row.city,
    productTypes: row.product_types || [],
    priority: row.priority,
    routingRules: row.routing_rules || null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toDispatchUnitDTO
};
