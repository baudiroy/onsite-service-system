const bcrypt = require('bcryptjs');

const { env } = require('../config/env');
const { withTransaction } = require('./transaction');
const { UserRepository } = require('../repositories/UserRepository');
const { RoleRepository } = require('../repositories/RoleRepository');
const { PermissionRepository } = require('../repositories/PermissionRepository');

const userRepository = new UserRepository();
const roleRepository = new RoleRepository();
const permissionRepository = new PermissionRepository();

const ADMIN_ROLE = {
  roleKey: 'admin',
  name: 'Admin',
  description: 'Full administrative access for the backend foundation.',
  enabled: true
};

const PERMISSIONS = [
  ['cases.create', 'cases', 'create', 'Create cases'],
  ['cases.read', 'cases', 'read', 'Read cases'],
  ['cases.update', 'cases', 'update', 'Update cases'],
  ['cases.review', 'cases', 'review', 'Review cases'],
  ['cases.accept', 'cases', 'accept', 'Accept cases'],
  ['cases.reject', 'cases', 'reject', 'Reject cases'],
  ['cases.cancel', 'cases', 'cancel', 'Cancel cases'],
  ['cases.close', 'cases', 'close', 'Close completed cases'],
  ['customers.create', 'customers', 'create', 'Create customers'],
  ['customers.read', 'customers', 'read', 'Read customers'],
  ['customers.update', 'customers', 'update', 'Update customers'],
  ['attachments.create', 'attachments', 'create', 'Create attachments'],
  ['attachments.read', 'attachments', 'read', 'Read attachments'],
  ['attachments.delete', 'attachments', 'delete', 'Delete attachments'],
  ['dispatch_units.manage', 'dispatch_units', 'manage', 'Manage dispatch units'],
  ['dispatch.manage', 'dispatch', 'manage', 'Manage dispatch assignments'],
  ['appointments.manage', 'appointments', 'manage', 'Manage appointments'],
  ['service_reports.manage', 'service_reports', 'manage', 'Manage field service reports'],
  ['billing.manage', 'billing', 'manage', 'Manage billing and settlement records'],
  ['notifications.read', 'notifications', 'read', 'Read notification settings and logs'],
  ['notifications.manage', 'notifications', 'manage', 'Manage notification settings and templates'],
  ['ai.read', 'ai', 'read', 'Read AI jobs'],
  ['ai.manage', 'ai', 'manage', 'Trigger AI and OCR jobs'],
  ['line.read', 'line', 'read', 'Read LINE channel settings'],
  ['line.manage', 'line', 'manage', 'Manage LINE channel settings'],
  ['organizations.read', 'organizations', 'read', 'Read organizations'],
  ['organizations.manage', 'organizations', 'manage', 'Manage organizations'],
  ['audit_logs.read', 'audit_logs', 'read', 'Read audit logs'],
  ['users.read', 'users', 'read', 'Read users'],
  ['users.manage', 'users', 'manage', 'Manage users'],
  ['roles.manage', 'roles', 'manage', 'Manage roles'],
  ['permissions.manage', 'permissions', 'manage', 'Manage permissions']
];

async function ensurePermission([permissionKey, module, action, description], client) {
  const existing = await permissionRepository.findByPermissionKey(permissionKey, client);

  if (existing) {
    return existing;
  }

  return permissionRepository.createPermission({
    permissionKey,
    module,
    action,
    description,
    enabled: true
  }, client);
}

async function ensureAdminRole(client) {
  const existing = await roleRepository.findByRoleKey(ADMIN_ROLE.roleKey, client);

  if (existing) {
    return existing;
  }

  return roleRepository.createRole(ADMIN_ROLE, client);
}

async function ensureAdminUser(client) {
  const passwordHash = await bcrypt.hash(env.seedAdminPassword, 12);
  const existing = await userRepository.findByEmail(env.seedAdminEmail, client);

  if (existing) {
    return userRepository.updateSeededAdminUser(existing.id, {
      displayName: env.seedAdminDisplayName,
      status: 'active',
      passwordHash
    }, client);
  }

  return userRepository.createUser({
    displayName: env.seedAdminDisplayName,
    email: env.seedAdminEmail,
    userType: 'admin',
    status: 'active',
    passwordHash,
    authProvider: 'password',
    metadata: {
      seeded: true
    }
  }, client);
}

async function ensureOptionalSmokeUser(client) {
  if (!env.seedSmokeUserEmail || !env.seedSmokeUserPassword) {
    return null;
  }

  const email = env.seedSmokeUserEmail.toLowerCase();
  const existing = await userRepository.findByEmail(email, client);

  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(env.seedSmokeUserPassword, 12);

  return userRepository.createUser({
    displayName: env.seedSmokeUserDisplayName,
    email,
    userType: 'customer_service',
    status: 'active',
    passwordHash,
    authProvider: 'password',
    metadata: {
      seeded: true,
      smokeUser: true
    }
  }, client);
}

async function seed() {
  await withTransaction(async (client) => {
    const adminRole = await ensureAdminRole(client);
    const permissions = [];

    for (const permissionDefinition of PERMISSIONS) {
      permissions.push(await ensurePermission(permissionDefinition, client));
    }

    for (const permission of permissions) {
      await permissionRepository.grantPermissionToRole({
        roleId: adminRole.id,
        permissionId: permission.id
      }, client);
    }

    const adminUser = await ensureAdminUser(client);
    await ensureOptionalSmokeUser(client);

    await roleRepository.assignRoleToUser({
      userId: adminUser.id,
      roleId: adminRole.id
    }, client);
  });

  console.log('Database seed complete.');
  console.log(`Admin email: ${env.seedAdminEmail}`);
}

seed().catch((error) => {
  console.error('Database seed failed', {
    name: error.name,
    code: error.code,
    message: error.message,
    errors: error.errors?.map((item) => ({
      code: item.code,
      address: item.address,
      port: item.port,
      message: item.message
    })),
    stack: error.stack
  });
  process.exit(1);
});
