'use strict';
/* Data Access Object (DAO) module for accessing users */

const sqlite = require('sqlite3');
const crypto = require('crypto');

// open the database
const db = new sqlite.Database('data.db', (err) => {
  if (err) throw err;
});

/**
 * Get the user info, given the id
 * @param {number} id the id of the user
 */
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
        const user = { id: row.id, username: row.email, name: row.name }
        resolve(user);
      }
    });
  });
};

/**
 * Get the user,if exists, given the email and password
 * @param {string} email the email of the user to check
 * @param {string} password the password of the user to check
 */
exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE email = ?';
    db.get(sql, [email], (err, row) => {

      if (err) { reject(err); }
      else if (row === undefined) { resolve(false); }
      else {
        const user = { id: row.id, username: row.email, name: row.name }
        const salt = row.salt;
        crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
          if (err) reject(err);
          const passwordHex = Buffer.from(row.hash, 'hex');

          if (!crypto.timingSafeEqual(passwordHex, hashedPassword))
            resolve(false);
          else resolve(user);
        });
      }
    });
  });
};

/**
 * Get the user fulltime info, given the id
 * @param {number} id the id of the user
 */
 exports.getUserFullTimeInfo = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT fulltime FROM user WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err){
        reject(err);
      }
        else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        resolve(row.fulltime!==null?Boolean(row.fulltime):undefined);
      }
    });
  });
};
