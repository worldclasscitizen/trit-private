import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const FEED_TYPE = __ENV.FEED_TYPE || 'redis';

export const options = {
    stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 },
        { duration: '30s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'],
        http_req_failed: ['rate<0.02']
    }
};

export function setup() {
    const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email: 'benchmark_user_1@trit.com',
            password: 'password123'
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    let token = '';
    if (loginRes.status === 200) {
        token = loginRes.json('accessToken');
    }
    return { token };
}

export default function (data) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (data.token) {
        headers['Authorization'] = `Bearer ${data.token}`;
    }

    const isWrite = Math.random() < 0.2;

    if (isWrite) {
        const payload = JSON.stringify({
            tripId: 1,
            title: `Bench Log ${Date.now()}`,
            content: 'Benchmark test log content with photos and details.',
            visibility: 'PUBLIC'
        });
        const res = http.post(`${BASE_URL}/api/trip-logs`, payload, { headers });
        check(res, {
            'write success': (r) => r.status === 201 || r.status === 200
        });
    } else {
        const url = `${BASE_URL}/api/trip-logs/feed/friends?type=${FEED_TYPE}&limit=10`;
        const res = http.get(url, { headers });
        check(res, {
            'read success': (r) => r.status === 200
        });
    }

    sleep(1);
}
