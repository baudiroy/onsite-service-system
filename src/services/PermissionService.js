const { RoleRepository } = require('../repositories/RoleRepository');
const { PermissionRepository } = require('../repositories/PermissionRepository');

class PermissionService {
  constructor({
    roleRepository = new RoleRepository(),
    permissionRepository = new PermissionRepository()
  } = {}) {
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
  }

  async getUserRoles(userId, client) {
    return this.roleRepository.getUserRoles(userId, client);
  }

  async getUserPermissions(userId, client) {
    const permissions = await this.permissionRepository.getUserPermissions(userId, client);
    return permissions.map((permission) => permission.permission_key);
  }

  async hasPermission(userId, permissionKey, client) {
    const permissionKeys = await this.getUserPermissions(userId, client);
    return permissionKeys.includes(permissionKey);
  }
}

module.exports = {
  PermissionService
};
