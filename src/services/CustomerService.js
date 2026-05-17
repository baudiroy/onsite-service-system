const { CustomerRepository } = require('../repositories/CustomerRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { toCustomerDTO } = require('../mappers/customerMapper');
const { toAdminCaseDTO } = require('../mappers/caseMapper');

const AUDITED_FIELDS = [
  'organizationId',
  'customerName',
  'mobile',
  'tel',
  'lineUserId',
  'city',
  'address',
  'source'
];

function toComparableCustomer(row) {
  return {
    organizationId: row.organization_id,
    customerName: row.customer_name,
    mobile: row.mobile,
    tel: row.tel,
    lineUserId: row.line_user_id,
    city: row.city,
    address: row.address,
    source: row.source
  };
}

function pickCustomerChanges(beforeRow, afterRow) {
  const beforeValue = toComparableCustomer(beforeRow);
  const afterValue = toComparableCustomer(afterRow);
  const beforeData = {};
  const afterData = {};

  for (const field of AUDITED_FIELDS) {
    if (beforeValue[field] !== afterValue[field]) {
      beforeData[field] = field === 'lineUserId' ? '[masked]' : beforeValue[field] ?? null;
      afterData[field] = field === 'lineUserId' ? '[masked]' : afterValue[field] ?? null;
    }
  }

  return {
    beforeData,
    afterData,
    hasChanges: Object.keys(afterData).length > 0
  };
}

class CustomerService {
  constructor({
    customerRepository = new CustomerRepository(),
    auditService = new AuditService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.customerRepository = customerRepository;
    this.auditService = auditService;
    this.organizationAccessService = organizationAccessService;
  }

  async createCustomer(input, actor, req = null) {
    return withTransaction(async (client) => {
      const organizationId = this.organizationAccessService.resolveCreateOrganizationId(
        actor,
        input.organizationId || null
      );
      await this.organizationAccessService.assertAccess(actor, organizationId, client);

      const existingByLine = input.lineUserId
        ? await this.customerRepository.findCustomerByLineUserId(input.lineUserId, organizationId, client)
        : null;

      if (existingByLine) {
        throw new ConflictError('lineUserId is already linked to another customer in this organization.');
      }

      const customer = await this.customerRepository.createCustomer({
        ...input,
        organizationId
      }, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'customer.created',
        entityType: 'customer',
        entityId: customer.id,
        afterData: {
          id: customer.id,
          organizationId: customer.organization_id,
          customerName: customer.customer_name,
          mobile: customer.mobile,
          tel: customer.tel,
          city: customer.city,
          address: customer.address,
          source: customer.source,
          hasLineUserId: Boolean(customer.line_user_id)
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: {
          requestId: req?.requestId || null
        }
      }, client);

      return toCustomerDTO(customer);
    });
  }

  async getCustomerById(customerId, actor) {
    const customer = await this.customerRepository.getCustomerById(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found.');
    }

    await this.organizationAccessService.assertAccess(actor, customer.organization_id);
    return toCustomerDTO(customer);
  }

  async updateCustomer(customerId, updates, actor, req = null) {
    return withTransaction(async (client) => {
      const existing = await this.customerRepository.getCustomerById(customerId, client);

      if (!existing) {
        throw new NotFoundError('Customer not found.');
      }

      await this.organizationAccessService.assertAccess(actor, existing.organization_id, client);
      if (updates.organizationId && updates.organizationId !== existing.organization_id) {
        await this.organizationAccessService.assertAccess(actor, updates.organizationId, client);
      }
      const effectiveOrganizationId = updates.organizationId || existing.organization_id || null;

      if (updates.lineUserId && updates.lineUserId !== existing.line_user_id) {
        const existingByLine = await this.customerRepository.findCustomerByLineUserId(
          updates.lineUserId,
          effectiveOrganizationId,
          client
        );

        if (existingByLine && existingByLine.id !== customerId) {
          throw new ConflictError('lineUserId is already linked to another customer in this organization.');
        }
      }

      const updated = await this.customerRepository.updateCustomer(customerId, updates, client);
      const changes = pickCustomerChanges(existing, updated);

      if (changes.hasChanges) {
        await this.auditService.record({
          actorType: actor?.userType || 'admin',
          actorId: actor?.id || null,
          actorDisplayName: actor?.displayName || null,
          action: 'customer.updated',
          entityType: 'customer',
          entityId: customerId,
          beforeData: changes.beforeData,
          afterData: changes.afterData,
          ipAddress: req?.ip || null,
          userAgent: req?.get?.('user-agent') || null,
          metadata: {
            requestId: req?.requestId || null
          }
        }, client);
      }

      return toCustomerDTO(updated);
    });
  }

  async listCustomers(query, actor) {
    const scopedFilter = await this.organizationAccessService.buildScopedFilter(actor, query.organizationId || null);
    const result = await this.customerRepository.listCustomers({
      filters: {
        ...query,
        ...scopedFilter
      },
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map(toCustomerDTO),
      pagination: result.pagination
    };
  }

  async getCustomerCases(customerId, query, actor) {
    const customer = await this.customerRepository.getCustomerById(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found.');
    }

    await this.organizationAccessService.assertAccess(actor, customer.organization_id);
    const scopedFilter = await this.organizationAccessService.buildScopedFilter(actor, customer.organization_id || null);

    const result = await this.customerRepository.getCasesByCustomerId(customerId, {
      filters: scopedFilter,
      pagination: {
        limit: query.limit,
        offset: query.offset
      },
      sort: query.sort
    });

    return {
      data: result.rows.map(toAdminCaseDTO),
      pagination: result.pagination
    };
  }

  async findOrCreateCustomerForAdminCase(customerInput, actor, req = null, client = null, organizationId = null) {
    if (!customerInput || typeof customerInput !== 'object') {
      throw new ValidationError('Customer data is required.', [
        {
          field: 'customer',
          message: 'Customer data is required.',
          code: 'required'
        }
      ]);
    }

    await this.organizationAccessService.assertAccess(actor, organizationId, client);

    if (customerInput.customerId) {
      const customer = await this.customerRepository.getCustomerById(customerInput.customerId, client);

      if (!customer) {
        throw new ValidationError('Invalid customerId.', [
          {
            field: 'customer.customerId',
            message: 'Customer does not exist or is deleted.',
            code: 'invalid_reference'
          }
        ]);
      }

      if ((customer.organization_id || null) !== (organizationId || null)) {
        throw new ValidationError('Customer does not belong to the selected organization.', [
          {
            field: 'customer.customerId',
            message: 'Customer does not belong to the selected organization.',
            code: 'organization_mismatch'
          }
        ]);
      }

      return {
        customer,
        linkMode: 'existing_customer_id',
        created: false
      };
    }

    const existing = await this.customerRepository.findCustomerByMobile(
      customerInput.mobile,
      organizationId,
      client
    );

    if (existing) {
      return {
        customer: existing,
        linkMode: 'existing_mobile_in_organization',
        created: false
      };
    }

    const customer = await this.customerRepository.createCustomer({
      ...customerInput,
      organizationId,
      source: customerInput.source || 'admin'
    }, client);

    await this.auditService.record({
      actorType: actor?.userType || 'admin',
      actorId: actor?.id || null,
      actorDisplayName: actor?.displayName || null,
      action: 'customer.created',
      entityType: 'customer',
      entityId: customer.id,
      afterData: {
        id: customer.id,
        organizationId: customer.organization_id,
        customerName: customer.customer_name,
        mobile: customer.mobile,
        tel: customer.tel,
        city: customer.city,
        address: customer.address,
        source: customer.source,
        hasLineUserId: Boolean(customer.line_user_id)
      },
      ipAddress: req?.ip || null,
      userAgent: req?.get?.('user-agent') || null,
      metadata: {
        requestId: req?.requestId || null,
        createdFrom: 'admin_case_create'
      }
    }, client);

    return {
      customer,
      linkMode: 'new_customer',
      created: true
    };
  }
}

module.exports = {
  CustomerService,
  pickCustomerChanges
};
