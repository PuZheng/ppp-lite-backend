var supertest = require('co-supertest');

module.exports = function *(app, email, password) {
    var rsp = yield supertest(app).post('/auth/login').send({
        email: email,
        password: password,
    }).end();
    if (rsp.error) {
        throw rsp.error;
    }
    return rsp.body;
};
