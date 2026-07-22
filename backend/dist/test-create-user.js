"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function test() {
    try {
        const loginRes = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': '123' },
            body: JSON.stringify({ username: 'admin', password: '123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.access_token;
        console.log('Got token:', token);
        const createRes = await fetch('http://localhost:3000/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-api-key': '123'
            },
            body: JSON.stringify({ username: 'paulo', password: '123' })
        });
        console.log('Create status:', createRes.status);
        console.log('Created user:', await createRes.text());
    }
    catch (err) {
        console.error('Error:', err);
    }
}
test();
//# sourceMappingURL=test-create-user.js.map