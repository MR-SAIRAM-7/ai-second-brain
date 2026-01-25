// Native fetch used


async function testAuth() {
    const baseUrl = 'http://localhost:5000/api/auth';
    const testUser = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'password123'
    };

    console.log('--- Testing Registration ---');
    try {
        const regRes = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        if (regRes.status === 201) {
            console.log('Registration Success:', await regRes.json());
        } else {
            console.error('Registration Failed:', regRes.status, await regRes.text());
            process.exit(1);
        }

        console.log('\n--- Testing Login ---');
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email, password: testUser.password })
        });

        if (loginRes.status === 200) {
            const data = await loginRes.json();
            if (data.token) {
                console.log('Login Success. Token received.');
                console.log('Token:', data.token.substring(0, 20) + '...');
            } else {
                console.error('Login Failed: No token returned', data);
                process.exit(1);
            }
        } else {
            console.error('Login Failed:', loginRes.status, await loginRes.text());
            process.exit(1);
        }

    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
}

// Check if native fetch exists, if not try to require (won't work if not installed, but checking node version usually safe)
if (!globalThis.fetch) {
    console.log("Native fetch not found, this script requires Node 18+");
    process.exit(1);
}

testAuth();
