import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const FEED_TYPE = __ENV.FEED_TYPE || 'redis';

export const options = {
    stages: [
        { duration: '30s', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '2m', target: 1500 },
        { duration: '30s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500', 'p(99)<3000'],
        http_req_failed: ['rate<0.02']
    }
};

export function setup() {
    const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email: 'normal_user_1@trit.com',
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

    let cursor = null;
    for (let scroll = 0; scroll < 3; scroll++) {
        let url = `${BASE_URL}/api/trip-logs/feed/friends?type=${FEED_TYPE}&limit=10`;
        if (cursor) {
            url += `&cursor=${cursor}`;
        }

        const res = http.get(url, { headers });
        const success = check(res, {
            'status is 200': (r) => r.status === 200,
            'response has data': (r) => {
                try {
                    const body = r.json();
                    return body && Array.isArray(body.content);
                } catch (e) {
                    return false;
                }
            }
        });

        if (success) {
            cursor = res.json('nextCursor');
            if (!res.json('hasNext') || !cursor) {
                break;
            }
        } else {
            break;
        }

        sleep(Math.random() * 3 + 2);
    }

    sleep(Math.random() * 4 + 3);
}
