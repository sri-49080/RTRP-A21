/**
 * Frontend Role Utility Functions
 * Helper functions to check user roles and permissions
 */

/**
 * Check if user has Admin role
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user && user.role === 'Admin';
}

/**
 * Check if user has Student role
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export function isStudent(user) {
  return user && user.role === 'Student';
}

/**
 * Check if user has specific permission/role
 * @param {object} user - User object
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {boolean}
 */
export function hasPermission(user, requiredRoles) {
  if (!user) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(user.role);
}

/**
 * Get user role display name
 * @param {object} user - User object
 * @returns {string}
 */
export function getRoleDisplay(user) {
  if (!user || !user.role) return 'Guest';
  return user.role === 'Admin' ? 'Administrator' : 'Student';
}
