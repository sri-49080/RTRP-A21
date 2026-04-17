/**
 * Role Assignment Module
 * Determines user role based on email domain
 * Supports multiple admin domains
 */

// Admin domains that should be assigned Admin role
const ADMIN_DOMAINS = [
  'admingmail.com',
  // Add more admin domains here as needed
];

/**
 * Determines user role based on email domain
 * @param {string} email - User's email address
 * @returns {string} - 'Admin' or 'Student'
 */
function assignRoleByEmail(email) {
  if (!email) return 'Student';
  
  const domain = email.split('@')[1]?.toLowerCase();
  
  // Check if domain is in admin domains list
  const isAdminDomain = ADMIN_DOMAINS.some(
    adminDomain => domain === adminDomain.toLowerCase()
  );
  
  return isAdminDomain ? 'Admin' : 'Student';
}

/**
 * Add a new admin domain
 * @param {string} domain - Domain to add
 */
function addAdminDomain(domain) {
  if (!domain) return false;
  if (ADMIN_DOMAINS.includes(domain.toLowerCase())) return false;
  ADMIN_DOMAINS.push(domain.toLowerCase());
  return true;
}

/**
 * Get all admin domains
 * @returns {string[]} - Array of admin domains
 */
function getAdminDomains() {
  return [...ADMIN_DOMAINS];
}

module.exports = { 
  assignRoleByEmail, 
  addAdminDomain, 
  getAdminDomains 
};
