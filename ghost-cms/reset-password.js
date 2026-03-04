/**
 * One-time Ghost admin password reset script.
 * Runs at container startup if GHOST_RESET_PASSWORD env var is set.
 * 
 * Usage: Set env var GHOST_RESET_PASSWORD=newtemppassword on Render
 *        then redeploy. After login, remove the env var and redeploy again.
 */
const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function resetPassword() {
  const newPassword = process.env.GHOST_RESET_PASSWORD;
  const targetEmail = process.env.GHOST_RESET_EMAIL || 'bill@opticwise.com';

  if (!newPassword) {
    return false;
  }

  console.log(`[Ghost Reset] Resetting password for ${targetEmail}...`);

  const connection = await mysql.createConnection({
    host: process.env.database__connection__host,
    port: parseInt(process.env.database__connection__port || '3306'),
    user: process.env.database__connection__user,
    password: process.env.database__connection__password,
    database: process.env.database__connection__database,
  });

  try {
    // Ghost uses bcryptjs - hash the new password
    // Ghost's bcrypt rounds = 10
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(newPassword, 10);

    const [rows] = await connection.execute(
      'SELECT id, name, email, status FROM users WHERE email = ?',
      [targetEmail]
    );

    if (rows.length === 0) {
      console.error(`[Ghost Reset] No user found with email: ${targetEmail}`);

      const [allUsers] = await connection.execute(
        'SELECT id, name, email, status FROM users LIMIT 10'
      );
      console.log('[Ghost Reset] Available users:', allUsers.map(u => `${u.email} (${u.status})`));
      await connection.end();
      return false;
    }

    const user = rows[0];
    console.log(`[Ghost Reset] Found user: ${user.name} (${user.email}), status: ${user.status}`);

    await connection.execute(
      'UPDATE users SET password = ?, status = ? WHERE id = ?',
      [hash, 'active', user.id]
    );

    console.log(`[Ghost Reset] Password updated successfully for ${targetEmail}`);
    console.log(`[Ghost Reset] IMPORTANT: Remove GHOST_RESET_PASSWORD env var after login!`);

    await connection.end();
    return true;
  } catch (error) {
    console.error('[Ghost Reset] Error:', error.message);
    await connection.end();
    return false;
  }
}

module.exports = resetPassword;

if (require.main === module) {
  resetPassword().then(ok => {
    process.exit(ok ? 0 : 1);
  });
}
