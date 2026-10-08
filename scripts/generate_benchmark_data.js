import fs from 'fs';
import path from 'path';

const userCount = parseInt(process.argv[2] || '5000', 10);
const outputPath = process.argv[3] || path.join('scripts', 'benchmark_data.sql');

const startTime = Date.now();
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });

writeStream.write("SET FOREIGN_KEY_CHECKS = 0;\n");
writeStream.write("TRUNCATE TABLE log_comment;\n");
writeStream.write("TRUNCATE TABLE log_like;\n");
writeStream.write("TRUNCATE TABLE trip_log;\n");
writeStream.write("TRUNCATE TABLE trip_item;\n");
writeStream.write("TRUNCATE TABLE trip;\n");
writeStream.write("TRUNCATE TABLE friendship;\n");
writeStream.write("TRUNCATE TABLE user_profile;\n");
writeStream.write("TRUNCATE TABLE user;\n");
writeStream.write("SET FOREIGN_KEY_CHECKS = 1;\n\n");

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleUnique(sourceMax, count, exclude) {
    const selected = new Set();
    const targetSize = Math.min(count, Math.max(0, sourceMax - 1));
    let attempts = 0;
    while (selected.size < targetSize && attempts < targetSize * 3) {
        attempts++;
        const candidate = getRandomInt(1, sourceMax);
        if (candidate !== exclude) {
            selected.add(candidate);
        }
    }
    if (selected.size < targetSize) {
        for (let i = 1; i <= sourceMax && selected.size < targetSize; i++) {
            if (i !== exclude) {
                selected.add(i);
            }
        }
    }
    return Array.from(selected);
}

const influencerRatio = 0.03;
const influencerCount = Math.max(1, Math.floor(userCount * influencerRatio));

console.log(`Configuring ${userCount} users (${influencerCount} influencers, ${userCount - influencerCount} normal users)...`);

const targetFriendsMap = new Int32Array(userCount + 1);

for (let u = 1; u <= influencerCount; u++) {
    const rand = Math.random();
    let target = 0;
    if (rand < 0.70) {
        target = getRandomInt(2000, 5000);
    } else if (rand < 0.90) {
        target = getRandomInt(10000, 20000);
    } else if (rand < 0.99) {
        target = getRandomInt(300000, 800000);
    } else {
        target = getRandomInt(1000000, 1500000);
    }
    targetFriendsMap[u] = Math.min(target, userCount - 1);
}

for (let u = influencerCount + 1; u <= userCount; u++) {
    const rand = Math.random();
    let target = 0;
    if (rand < 0.05) {
        target = getRandomInt(0, 50);
    } else if (rand < 0.90) {
        target = getRandomInt(250, 750);
    } else {
        target = getRandomInt(1000, 2000);
    }
    targetFriendsMap[u] = Math.min(target, userCount - 1);
}

console.log("Building bidirectional friendship network...");
const friendshipMap = new Map();
for (let u = 1; u <= userCount; u++) {
    friendshipMap.set(u, new Set());
}

for (let u = 1; u <= userCount; u++) {
    const myFriends = friendshipMap.get(u);
    const needed = targetFriendsMap[u] - myFriends.size;
    if (needed > 0) {
        const candidates = sampleUnique(userCount, needed, u);
        for (const target of candidates) {
            myFriends.add(target);
            friendshipMap.get(target).add(u);
        }
    }
}

const friendsCountArray = new Int32Array(userCount + 1);
for (let u = 1; u <= userCount; u++) {
    friendsCountArray[u] = friendshipMap.get(u).size;
}

console.log("Writing user and user_profile records...");
const batchSize = 1000;

for (let i = 1; i <= userCount; i += batchSize) {
    const endIdx = Math.min(i + batchSize - 1, userCount);
    const userValues = [];
    const profileValues = [];

    for (let u = i; u <= endIdx; u++) {
        const isInfluencer = u <= influencerCount;
        const nickname = isInfluencer ? `influencer_user_${u}` : `normal_user_${u}`;
        const email = `${nickname}@trit.com`;
        const pwdHash = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF";
        const fCount = friendsCountArray[u];

        userValues.push(`(${u}, 1, 1, '${email}', '${pwdHash}', '${nickname}', NULL, NOW(), NOW())`);
        profileValues.push(`(${u}, 'Bio of ${nickname}', 'Intro of ${nickname}', 1, 'Style summary', 1, NULL, 1, ${fCount}, NOW(), NOW())`);
    }

    writeStream.write("INSERT INTO user (id, role_id, status_id, email, password_hash, nickname, profile_image_url, created_at, updated_at) VALUES\n");
    writeStream.write(userValues.join(",\n") + ";\n");

    writeStream.write("INSERT INTO user_profile (user_id, bio, intro, home_region_id, travel_style_summary, travel_style_id, profile_banner_url, is_profile_public, friends_count, created_at, updated_at) VALUES\n");
    writeStream.write(profileValues.join(",\n") + ";\n\n");
}

console.log("Writing friendship records...");
let friendshipPairs = [];
for (let u = 1; u <= userCount; u++) {
    const friends = friendshipMap.get(u);
    for (const friendId of friends) {
        friendshipPairs.push(`(${u}, ${friendId}, NOW())`);
        if (friendshipPairs.length >= batchSize) {
            writeStream.write("INSERT INTO friendship (user_id_a, user_id_b, created_at) VALUES\n");
            writeStream.write(friendshipPairs.join(",\n") + ";\n");
            friendshipPairs = [];
        }
    }
}
if (friendshipPairs.length > 0) {
    writeStream.write("INSERT INTO friendship (user_id_a, user_id_b, created_at) VALUES\n");
    writeStream.write(friendshipPairs.join(",\n") + ";\n\n");
}

console.log("Generating trips, trip logs, likes, and comments...");
let globalTripId = 0;
let globalLogId = 0;
let globalCommentId = 0;
const nowMs = Date.now();

let tripBatch = [];
let logBatch = [];
let likeBatch = [];
let commentBatch = [];

function flushBatches() {
    if (tripBatch.length > 0) {
        writeStream.write("INSERT INTO trip (id, user_id, trip_status_id, title, start_date, end_date, visibility, location_summary, created_at, updated_at) VALUES\n");
        writeStream.write(tripBatch.join(",\n") + ";\n");
        tripBatch = [];
    }
    if (logBatch.length > 0) {
        writeStream.write("INSERT INTO trip_log (id, trip_id, title, content, visibility, created_at, updated_at) VALUES\n");
        writeStream.write(logBatch.join(",\n") + ";\n");
        logBatch = [];
    }
    if (likeBatch.length > 0) {
        writeStream.write("INSERT INTO log_like (user_id, log_id, created_at) VALUES\n");
        writeStream.write(likeBatch.join(",\n") + ";\n");
        likeBatch = [];
    }
    if (commentBatch.length > 0) {
        writeStream.write("INSERT INTO log_comment (id, log_id, user_id, parent_id, content, is_deleted, created_at, updated_at) VALUES\n");
        writeStream.write(commentBatch.join(",\n") + ";\n");
        commentBatch = [];
    }
}

for (let u = 1; u <= userCount; u++) {
    const activityRand = Math.random();
    let userLogCount = 0;
    if (activityRand < 0.30) {
        userLogCount = getRandomInt(1, 2);
    } else if (activityRand < 0.90) {
        userLogCount = getRandomInt(10, 30);
    } else {
        userLogCount = getRandomInt(300, 400);
    }

    const unloggedTrips = getRandomInt(0, Math.max(1, Math.floor(userLogCount * 0.3)));
    const userTripCount = userLogCount + unloggedTrips;

    const userTripIds = [];
    for (let t = 0; t < userTripCount; t++) {
        globalTripId++;
        userTripIds.push(globalTripId);
        const daysAgo = getRandomInt(1, 30);
        const tripDate = new Date(nowMs - (daysAgo * 86400000 + getRandomInt(0, 86400000)));
        const isoDate = tripDate.toISOString().slice(0, 19).replace('T', ' ');
        tripBatch.push(`(${globalTripId}, ${u}, 3, 'Trip ${globalTripId} of User ${u}', '2026-01-01', '2026-01-05', 'PUBLIC', 'Seoul, Korea', '${isoDate}', '${isoDate}')`);

        if (tripBatch.length >= batchSize) {
            flushBatches();
        }
    }

    const followersCount = friendsCountArray[u];

    for (let l = 0; l < userLogCount; l++) {
        globalLogId++;
        const currentLogId = globalLogId;
        const matchingTripId = userTripIds[l];
        const daysAgo = getRandomInt(0, 14);
        const logDate = new Date(nowMs - (daysAgo * 86400000 + getRandomInt(0, 86400000)));
        const isoDate = logDate.toISOString().slice(0, 19).replace('T', ' ');

        logBatch.push(`(${currentLogId}, ${matchingTripId}, 'Trip Log ${currentLogId}', 'Content of trip log ${currentLogId} by user ${u}', 'PUBLIC', '${isoDate}', '${isoDate}')`);

        if (followersCount > 0) {
            const likeRate = (getRandomInt(10, 20)) / 100;
            const targetLikes = Math.floor(followersCount * likeRate);
            const likeUsers = sampleUnique(userCount, targetLikes, u);
            for (const likerId of likeUsers) {
                likeBatch.push(`(${likerId}, ${currentLogId}, '${isoDate}')`);
                if (likeBatch.length >= batchSize) {
                    flushBatches();
                }
            }

            const commentRate = (getRandomInt(5, 80)) / 100;
            const targetComments = Math.floor(followersCount * commentRate);
            const commentUsers = sampleUnique(userCount, targetComments, u);
            for (const commenterId of commentUsers) {
                globalCommentId++;
                commentBatch.push(`(${globalCommentId}, ${currentLogId}, ${commenterId}, NULL, 'Comment ${globalCommentId} on log ${currentLogId}', 0, '${isoDate}', '${isoDate}')`);
                if (commentBatch.length >= batchSize) {
                    flushBatches();
                }
            }
        }

        if (logBatch.length >= batchSize || tripBatch.length >= batchSize) {
            flushBatches();
        }
    }
}

flushBatches();

writeStream.end(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Benchmark SQL generated at ${outputPath} in ${elapsedSec}s.`);
    console.log(`Summary: Users=${userCount}, Trips=${globalTripId}, Logs=${globalLogId}, Comments=${globalCommentId}`);
});
