import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8080';
const FEED_TYPE = __ENV.FEED_TYPE || 'hybrid-memcached';
const USER_EMAIL = __ENV.USER_EMAIL || 'normal_user_2@trit.com';

export const options = {
    stages: [
        { duration: '30s', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '2m', target: 800 },
        { duration: '30s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500', 'p(99)<2500'],
        http_req_failed: ['rate<0.01']
    }
};

export function setup() {
    const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email: USER_EMAIL,
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
            'response has feed content': (r) => {
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

        sleep(Math.random() * 2 + 1);
    }

    sleep(Math.random() * 3 + 2);
}
