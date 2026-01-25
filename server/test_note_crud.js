const API_URL = 'http://127.0.0.1:5000/api';

const POST = async (url, data, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['x-auth-token'] = token;

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    return parseResponse(response);
};

const GET = async (url, token) => {
    const headers = {};
    if (token) headers['x-auth-token'] = token;

    const response = await fetch(url, { method: 'GET', headers });
    return parseResponse(response);
};

const PUT = async (url, data, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['x-auth-token'] = token;

    const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });
    return parseResponse(response);
};

const DELETE = async (url, token) => {
    const headers = {};
    if (token) headers['x-auth-token'] = token;

    const response = await fetch(url, { method: 'DELETE', headers });
    return parseResponse(response);
};

const parseResponse = async (response) => {
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        if (!response.ok) {
            const error = new Error(json.msg || 'Request failed');
            error.response = { data: json, status: response.status };
            throw error;
        }
        return json;
    } catch (e) {
        console.error('Response was not JSON:', text);
        throw e;
    }
};

const runTest = async () => {
    const testUser = {
        username: 'cruduser_' + Date.now(),
        email: 'crud_' + Date.now() + '@example.com',
        password: 'password123'
    };

    console.log('--- Starting Note CRUD Test ---');

    console.log('1. Registering User...');
    await POST(`${API_URL}/auth/register`, testUser);

    console.log('2. Logging In...');
    const loginRes = await POST(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
    });
    const token = loginRes.token;
    console.log('   Token received.');

    console.log('3. Creating Note...');
    const note1 = await POST(`${API_URL}/notes`, {}, token);
    console.log('   Note created:', note1.title, note1._id);

    console.log('4. Getting Notes...');
    const notes = await GET(`${API_URL}/notes`, token);
    console.log(`   Fetched ${notes.length} notes.`);
    if (notes.length !== 1) throw new Error('Note count mismatch');

    console.log('5. Updating Note...');
    const updatedNote = await PUT(`${API_URL}/notes/${note1._id}`, {
        title: 'Updated Title',
        content: { text: 'Some content' }
    }, token);
    console.log('   Note updated:', updatedNote.title);
    if (updatedNote.title !== 'Updated Title') throw new Error('Update failed');

    console.log('6. Deleting Note...');
    await DELETE(`${API_URL}/notes/${note1._id}`, token);
    console.log('   Note deleted.');

    console.log('7. Verifying Deletion...');
    const notesAfter = await GET(`${API_URL}/notes`, token);
    console.log(`   Fetched ${notesAfter.length} notes.`);
    if (notesAfter.length !== 0) throw new Error('Delete failed');

    console.log('--- CRUD Test Completed Successfully ---');
};

runTest().catch(console.error);
