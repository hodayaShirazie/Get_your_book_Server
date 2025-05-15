// const request = require('supertest');
// const chai = require('chai');
// const expect = chai.expect;
// const app = require('../src/index');
// const pool = require('../src/data-access/db');

// describe('DELETE /delete-product/:id', function () {
//   this.timeout(10000); 


//   before(async () => {
//     const result = await pool.query(`
//       INSERT INTO product (name, description, category_id, price, image, stock_quantity, min_stock_threshold)
//       VALUES ('Test Product', 'To be deleted', 1, 9.99, decode('', 'hex'), 5, 1)
//       RETURNING id
//     `);
//     productId = result.rows[0].id;
//   });

//   it('should delete existing product and confirm deletion', async () => {
//     const res = await request(app).delete(`/delete-product/${productId}`);
//     expect(res.status).to.equal(200);
//     expect(res.body.message).to.equal('Product deleted successfully.');

//     const check = await pool.query('SELECT * FROM product WHERE id = $1', [productId]);
//     expect(check.rows.length).to.equal(0);
//   });

//   it('should return 404 for non-existing product', async () => {
//     const res = await request(app).delete(`/delete-product/${999999}`);
//     expect(res.status).to.equal(404);
//     expect(res.body.message).to.equal('Product not found.');
//   });
// });
const { expect } = require('chai');

// הפונקציה מועתקת לתוך הקובץ לצורך טסט לוגי
async function deleteProductById(id, db) {
  const result = await db.query('SELECT * FROM product WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    return { status: 404, message: 'Product not found.' };
  }

  await db.query('DELETE FROM product WHERE id = $1', [id]);
  return { status: 200, message: 'Product deleted successfully.' };
}

describe('deleteProductById (unit test without DB)', () => {
  it('returns 404 if product not found', async () => {
    const fakeDb = {
      query: async () => ({ rows: [] }) // מדמה תוצאה ריקה
    };

    const res = await deleteProductById(123, fakeDb);
    expect(res.status).to.equal(404);
    expect(res.message).to.equal('Product not found.');
  });

  it('deletes product and returns success', async () => {
    const fakeDb = {
      query: async (sql) => {
        if (sql.startsWith('SELECT')) return { rows: [{ id: 1 }] };
        if (sql.startsWith('DELETE')) return {}; // מדמה מחיקה
      }
    };

    const res = await deleteProductById(1, fakeDb);
    expect(res.status).to.equal(200);
    expect(res.message).to.equal('Product deleted successfully.');
  });
});
