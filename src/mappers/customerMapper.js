function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function maskLineUserId(value) {
  if (!value) return null;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function toCustomerDTO(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationSummary: row.organization_id ? {
      code: row.organization_code || null,
      name: row.organization_name || null
    } : null,
    customerName: row.customer_name,
    mobile: row.mobile,
    tel: row.tel,
    lineUserIdMasked: maskLineUserId(row.line_user_id),
    city: row.city,
    address: row.address,
    source: row.source,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

module.exports = {
  toCustomerDTO,
  maskLineUserId
};
