const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../src/index');
const pool = require('../src/data-access/db');

describe('DELETE /delete-product/:id', function () {
  this.timeout(10000); 


  before(async () => {
    const result = await pool.query(`
      INSERT INTO product (name, description, category_id, price, image, stock_quantity, min_stock_threshold)
      VALUES ('Test Product', 'To be deleted', 1, 9.99, decode('', 'hex'), 5, 1)
      RETURNING id
    `);
    productId = result.rows[0].id;
  });

  it('should delete existing product and confirm deletion', async () => {
    const res = await request(app).delete(`/delete-product/${productId}`);
    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Product deleted successfully.');

    const check = await pool.query('SELECT * FROM product WHERE id = $1', [productId]);
    expect(check.rows.length).to.equal(0);
  });

  it('should return 404 for non-existing product', async () => {
    const res = await request(app).delete(`/delete-product/${999999}`);
    expect(res.status).to.equal(404);
    expect(res.body.message).to.equal('Product not found.');
  });
});
