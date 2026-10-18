import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const FEED_TYPE = __ENV.FEED_TYPE || 'hybrid-memcached';

export const options = {
    scenarios: {
        feed_scroll: {
            executor: 'ramping-vus',
            exec: 'feedScrollScenario',
            stages: [
                { duration: '30s', target: 350 },
                { duration: '1m', target: 700 },
                { duration: '2m', target: 1050 },
                { duration: '30s', target: 0 }
            ],
            tags: { scenario: 'feed_scroll' }
        },
        like_burst: {
            executor: 'ramping-vus',
            exec: 'likeBurstScenario',
            stages: [
                { duration: '30s', target: 75 },
                { duration: '1m', target: 150 },
                { duration: '2m', target: 225 },
                { duration: '30s', target: 0 }
            ],
            tags: { scenario: 'like_burst' }
        },
        comment_activity: {
            executor: 'ramping-vus',
            exec: 'commentScenario',
            stages: [
                { duration: '30s', target: 50 },
                { duration: '1m', target: 100 },
                { duration: '2m', target: 150 },
                { duration: '30s', target: 0 }
            ],
            tags: { scenario: 'comment_activity' }
        },
        post_creation: {
            executor: 'ramping-vus',
            exec: 'postCreationScenario',
            stages: [
                { duration: '30s', target: 20 },
                { duration: '1m', target: 40 },
                { duration: '2m', target: 60 },
                { duration: '30s', target: 0 }
            ],
            tags: { scenario: 'post_creation' }
        },
        heavy_influencer_feed: {
            executor: 'ramping-vus',
            exec: 'heavyInfluencerScenario',
            stages: [
                { duration: '30s', target: 5 },
                { duration: '1m', target: 10 },
                { duration: '2m', target: 15 },
                { duration: '30s', target: 0 }
            ],
            tags: { scenario: 'heavy_influencer_feed' }
        }
    },
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<3500'],
        http_req_failed: ['rate<0.02'],
        'http_req_duration{scenario:feed_scroll}': ['p(95)<1500'],
        'http_req_duration{scenario:like_burst}': ['p(95)<400'],
        'http_req_duration{scenario:heavy_influencer_feed}': ['p(95)<2500']
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

    const heavyLoginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email: 'normal_user_2@trit.com',
            password: 'password123'
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    let heavyToken = '';
    if (heavyLoginRes.status === 200) {
        heavyToken = heavyLoginRes.json('accessToken');
    }

    return {
        tokens: tokens.length > 0 ? tokens : (heavyToken ? [heavyToken] : []),
        heavyToken: heavyToken || (tokens.length > 0 ? tokens[0] : '')
    };
}

function getAuthHeaders(token) {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

function getVuToken(data) {
    if (!data.tokens || data.tokens.length === 0) {
        return '';
    }
    return data.tokens[(__VU - 1) % data.tokens.length];
}

export function feedScrollScenario(data) {
    const headers = getAuthHeaders(getVuToken(data));
    let cursor = null;

    for (let scroll = 0; scroll < 3; scroll++) {
        let url = `${BASE_URL}/api/trip-logs/feed/friends?type=${FEED_TYPE}&limit=10`;
        if (cursor) {
            url += `&cursor=${cursor}`;
        }

        const res = http.get(url, { headers });
        const success = check(res, {
            'feed scroll status is 200': (r) => r.status === 200,
            'feed scroll has content': (r) => {
                const body = r.json();
                return body && Array.isArray(body.content);
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

export function likeBurstScenario(data) {
    const headers = getAuthHeaders(getVuToken(data));
    const targetLogId = Math.floor(Math.random() * 5) + 1;
    const isLike = Math.random() < 0.6;
    let res;

    if (isLike) {
        res = http.post(`${BASE_URL}/api/trip-logs/${targetLogId}/likes`, null, { headers });
    } else {
        res = http.del(`${BASE_URL}/api/trip-logs/${targetLogId}/likes`, null, { headers });
    }

    check(res, {
        'like burst status is 200': (r) => r.status === 200,
        'like burst has like count': (r) => {
            const body = r.json();
            return body && typeof body.likeCount === 'number';
        }
    });

    sleep(Math.random() * 0.8 + 0.2);
}

export function commentScenario(data) {
    const headers = getAuthHeaders(getVuToken(data));
    const targetLogId = Math.floor(Math.random() * 10) + 1;

    const detailRes = http.get(`${BASE_URL}/api/trip-logs/${targetLogId}`, { headers });
    check(detailRes, {
        'detail status is 200': (r) => r.status === 200
    });

    sleep(Math.random() * 1 + 0.5);

    const commentPayload = JSON.stringify({
        content: `Benchmark test comment at ${Date.now()}`,
        parentId: null
    });

    const commentRes = http.post(`${BASE_URL}/api/trip-logs/${targetLogId}/comments`, commentPayload, { headers });
    check(commentRes, {
        'comment status is 201': (r) => r.status === 201
    });

    sleep(Math.random() * 3 + 2);
}

export function postCreationScenario(data) {
    const headers = getAuthHeaders(getVuToken(data));
    const payload = JSON.stringify({
        tripId: 1,
        title: `Mixed Bench Post ${Date.now()}`,
        content: 'Realistic mixed benchmark trip log content.',
        visibility: 'PUBLIC'
    });

    const res = http.post(`${BASE_URL}/api/trip-logs`, payload, { headers });
    check(res, {
        'post creation status is 200 or 201': (r) => r.status === 200 || r.status === 201
    });

    sleep(Math.random() * 4 + 4);
}

export function heavyInfluencerScenario(data) {
    const headers = getAuthHeaders(data.heavyToken || getVuToken(data));
    let cursor = null;

    for (let scroll = 0; scroll < 2; scroll++) {
        let url = `${BASE_URL}/api/trip-logs/feed/friends?type=${FEED_TYPE}&limit=10`;
        if (cursor) {
            url += `&cursor=${cursor}`;
        }

        const res = http.get(url, { headers });
        const success = check(res, {
            'heavy influencer feed is 200': (r) => r.status === 200,
            'heavy influencer feed has content': (r) => {
                const body = r.json();
                return body && Array.isArray(body.content);
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
