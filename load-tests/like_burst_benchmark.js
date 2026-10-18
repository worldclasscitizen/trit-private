import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TARGET_LOG_ID = __ENV.TARGET_LOG_ID || '1';

export const options = {
    stages: [
        { duration: '30s', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '2m', target: 1500 },
        { duration: '30s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<300', 'p(99)<800'],
        http_req_failed: ['rate<0.01']
    }
};

export function setup() {
    const tokens = [];
    const poolSize = 30;
    for (let i = 1; i <= poolSize; i++) {
        const loginRes = http.post(
            `${BASE_URL}/api/auth/login`,
            JSON.stringify({
                email: `normal_user_${i}@trit.com`,
                password: 'password123'
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );
        if (loginRes.status === 200 && loginRes.json('accessToken')) {
            tokens.push(loginRes.json('accessToken'));
        }
    }
    return { tokens };
}

export default function (data) {
    const token = data.tokens && data.tokens.length > 0
        ? data.tokens[(__VU - 1) % data.tokens.length]
        : '';

    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const isLike = Math.random() < 0.6;
    let res;

    if (isLike) {
        res = http.post(`${BASE_URL}/api/trip-logs/${TARGET_LOG_ID}/likes`, null, { headers });
    } else {
        res = http.del(`${BASE_URL}/api/trip-logs/${TARGET_LOG_ID}/likes`, null, { headers });
    }

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has like count': (r) => {
            const body = r.json();
            return body && typeof body.likeCount === 'number';
        }
    });

    sleep(Math.random() * 0.5 + 0.1);
}
