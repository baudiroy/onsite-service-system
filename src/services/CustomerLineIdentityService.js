const { CustomerRepository } = require('../repositories/CustomerRepository');
const { LineChannelRepository } = require('../repositories/LineChannelRepository');
const { CustomerLineIdentityRepository } = require('../repositories/CustomerLineIdentityRepository');
const { AuditService } = require('./AuditService');
const { OrganizationAccessService } = require('./OrganizationAccessService');
const { withTransaction } = require('../db/transaction');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { toCustomerLineIdentityDTO, maskLineUserId } = require('../mappers/lineMapper');

class CustomerLineIdentityService {
  constructor({
    customerRepository = new CustomerRepository(),
    lineChannelRepository = new LineChannelRepository(),
    customerLineIdentityRepository = new CustomerLineIdentityRepository(),
    auditService = new AuditService(),
    organizationAccessService = new OrganizationAccessService()
  } = {}) {
    this.customerRepository = customerRepository;
    this.lineChannelRepository = lineChannelRepository;
    this.customerLineIdentityRepository = customerLineIdentityRepository;
    this.auditService = auditService;
    this.organizationAccessService = organizationAccessService;
  }

  async getScopedCustomer(customerId, actor, client) {
    const customer = await this.customerRepository.getCustomerById(customerId, client);
    if (!customer) throw new NotFoundError('Customer not found.');

    await this.organizationAccessService.assertAccess(actor, customer.organization_id, client);
    return customer;
  }

  async listCustomerLineIdentities(customerId, actor) {
    return withTransaction(async (client) => {
      await this.getScopedCustomer(customerId, actor, client);
      const identities = await this.customerLineIdentityRepository.listByCustomerId(customerId, client);
      return identities.map(toCustomerLineIdentityDTO);
    });
  }

  async linkCustomerLineIdentity(customerId, input, actor, req = null) {
    return withTransaction(async (client) => {
      const customer = await this.getScopedCustomer(customerId, actor, client);
      const lineUserId = input.lineUserId?.trim();

      if (!lineUserId) {
        throw new ValidationError('lineUserId is required.', [
          { field: 'lineUserId', message: 'lineUserId is required.', code: 'required' }
        ]);
      }

      const channel = await this.lineChannelRepository.getLineChannelById(input.lineChannelId, client);
      if (!channel) throw new NotFoundError('LINE channel not found.');

      if ((customer.organization_id || null) !== (channel.organization_id || null)) {
        throw new ValidationError('Customer and LINE channel must belong to the same organization.', [
          { field: 'lineChannelId', message: 'LINE channel organization must match customer organization.', code: 'organization_mismatch' }
        ]);
      }

      await this.organizationAccessService.assertAccess(actor, channel.organization_id, client);

      const existing = await this.customerLineIdentityRepository.findByLineIdentity({
        organizationId: channel.organization_id,
        lineChannelId: channel.id,
        lineUserId
      }, client);

      if (existing?.customer_id && existing.customer_id !== customer.id) {
        throw new ConflictError('LINE identity is already linked to another customer.');
      }

      let identity = existing;
      let auditAction = 'customer_line_identity.linked';

      if (existing?.customer_id === customer.id) {
        return toCustomerLineIdentityDTO(existing);
      }

      if (existing && !existing.customer_id) {
        await this.customerLineIdentityRepository.linkIdentityToCustomer(existing.id, customer.id, client);
        identity = await this.customerLineIdentityRepository.getIdentityById(existing.id, client);
      } else {
        const created = await this.customerLineIdentityRepository.createPendingIdentity({
          organizationId: customer.organization_id,
          lineChannelId: channel.id,
          lineUserId,
          displayName: input.displayName || null,
          customerId: customer.id
        }, client);
        identity = await this.customerLineIdentityRepository.getIdentityById(created.id, client);
      }

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: auditAction,
        entityType: 'customer_line_identity',
        entityId: identity.id,
        afterData: {
          customerId: customer.id,
          organizationId: customer.organization_id,
          lineChannelId: channel.id,
          channelCode: channel.channel_code,
          lineUserIdMasked: maskLineUserId(lineUserId),
          displayName: input.displayName || null
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toCustomerLineIdentityDTO(identity);
    });
  }

  async unlinkCustomerLineIdentity(customerId, identityId, actor, req = null) {
    return withTransaction(async (client) => {
      const customer = await this.getScopedCustomer(customerId, actor, client);
      const identity = await this.customerLineIdentityRepository.getIdentityById(identityId, client);

      if (!identity || identity.customer_id !== customer.id) {
        throw new NotFoundError('LINE identity not found.');
      }

      await this.organizationAccessService.assertAccess(actor, identity.organization_id, client);

      const unlinked = await this.customerLineIdentityRepository.unlinkIdentity(identity.id, client);

      await this.auditService.record({
        actorType: actor?.userType || 'admin',
        actorId: actor?.id || null,
        actorDisplayName: actor?.displayName || null,
        action: 'customer_line_identity.unlinked',
        entityType: 'customer_line_identity',
        entityId: identity.id,
        beforeData: {
          customerId: customer.id,
          organizationId: identity.organization_id,
          lineChannelId: identity.line_channel_id,
          channelCode: identity.channel_code || null,
          lineUserIdMasked: maskLineUserId(identity.line_user_id),
          displayName: identity.display_name || null
        },
        afterData: {
          unlinkedAt: unlinked?.unlinked_at || null
        },
        ipAddress: req?.ip || null,
        userAgent: req?.get?.('user-agent') || null,
        metadata: { requestId: req?.requestId || null }
      }, client);

      return toCustomerLineIdentityDTO(identity);
    });
  }
}

module.exports = {
  CustomerLineIdentityService
};
