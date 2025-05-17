const { expect } = require('chai');

async function login(username, password, db) {
  const result = await db.query(
    'SELECT * FROM users WHERE username = $1 AND password = $2',
    [username, password]
  );

  if (result.rows.length === 0) {
    return { status: 401, body: { message: 'Invalid username or password' } };
  }

  const user = result.rows[0];
  return {
    status: 200,
    body: {
      success: true,
      role: user.role,
      username: user.username,
    }
  };
}

describe('login (unit test)', () => {
  it('should login as admin', async () => {
    const fakeDb = {
      query: async () => ({
        rows: [{ username: 'admin123', role: 'admin' }]
      })
    };

    const res = await login('admin123', 'admin123!', fakeDb);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.role).to.equal('admin');
    expect(res.body.username).to.equal('admin123');
  });

  it('should fail login with wrong credentials', async () => {
    const fakeDb = {
      query: async () => ({ rows: [] }) 
    };

    const res = await login('wrong', 'wrongpass', fakeDb);
    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Invalid username or password');
  });

  it('should login as customer', async () => {
    const fakeDb = {
      query: async () => ({
        rows: [{ username: 'tehila', role: 'customer' }]
      })
    };

    const res = await login('tehila', '12340015!', fakeDb);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.role).to.equal('customer');
    expect(res.body.username).to.equal('tehila');
  });
});