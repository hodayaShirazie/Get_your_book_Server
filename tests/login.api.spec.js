const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../src/index');

describe('POST /login', () => {
  it('should login as admin and get redirected to /admin-home', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'admin123', password: 'admin123!' }); 

    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.role).to.equal('admin');
    expect(res.body.username).to.equal('admin123'); 
  });

  it('should fail login with wrong credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'wrong', password: 'wrongpass' });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('Invalid username or password');
  });

  it('should login as customer and get role "customer"', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'tehila', password: '12340015!' });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.be.true;
    expect(res.body.role).to.equal('customer');
    expect(res.body.username).to.equal('tehila');
  });
});
