const { pool } = require('../db/pool');
const { withTransaction } = require('../db/transaction');

class BaseRepository {
  constructor(db = pool) {
    this.db = db;
  }

  async query(sql, params = [], client = this.db) {
    return client.query(sql, params);
  }

  async queryOne(sql, params = [], client = this.db) {
    const result = await this.query(sql, params, client);
    return result.rows[0] || null;
  }

  async queryMany(sql, params = [], client = this.db) {
    const result = await this.query(sql, params, client);
    return result.rows;
  }

  getPagination({ limit = 50, offset = 0, maxLimit = 100 } = {}) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), maxLimit);
    const parsedOffset = Math.max(Number(offset) || 0, 0);

    return {
      limit: parsedLimit,
      offset: parsedOffset
    };
  }

  async withTransaction(callback) {
    return withTransaction(callback);
  }
}

module.exports = {
  BaseRepository
};
