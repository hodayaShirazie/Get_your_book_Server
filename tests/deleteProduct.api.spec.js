const { expect } = require('chai');

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
      query: async () => ({ rows: [] }) 
    };

    const res = await deleteProductById(123, fakeDb);
    expect(res.status).to.equal(404);
    expect(res.message).to.equal('Product not found.');
  });

  it('deletes product and returns success', async () => {
    const fakeDb = {
      query: async (sql) => {
        if (sql.startsWith('SELECT')) return { rows: [{ id: 1 }] };
        if (sql.startsWith('DELETE')) return {}; 
      }
    };

    const res = await deleteProductById(1, fakeDb);
    expect(res.status).to.equal(200);
    expect(res.message).to.equal('Product deleted successfully.');
  });
});
