import fs from 'fs';
import path from 'path';

const userCount = parseInt(process.argv[2] || '1500000', 10);
const outputPath = process.argv[3] || path.join('scripts', 'benchmark_data.sql');

const startTime = Date.now();
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });

writeStream.write("SET FOREIGN_KEY_CHECKS = 0;\n");
writeStream.write("SET UNIQUE_CHECKS = 0;\n");
writeStream.write("SET autocommit = 0;\n");
writeStream.write("TRUNCATE TABLE log_comment;\n");
writeStream.write("TRUNCATE TABLE log_like;\n");
writeStream.write("TRUNCATE TABLE trip_log;\n");
writeStream.write("TRUNCATE TABLE trip_item;\n");
writeStream.write("TRUNCATE TABLE trip;\n");
writeStream.write("TRUNCATE TABLE friendship;\n");
writeStream.write("TRUNCATE TABLE user_profile;\n");
writeStream.write("TRUNCATE TABLE user;\n\n");

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const megaInfluencerCount = 1;
const macroInfluencerCount = Math.min(10, Math.max(1, Math.floor(userCount * 0.0001)));
const microInfluencerCount = Math.min(500, Math.max(1, Math.floor(userCount * 0.001)));
const totalInfluencers = megaInfluencerCount + macroInfluencerCount + microInfluencerCount;

console.log(`Configuring target user base of ${userCount} users with realistic social topology...`);

const friendsCountEstimates = new Int32Array(userCount + 1);

if (userCount > 1) {
    friendsCountEstimates[1] = Math.min(1000000, userCount - 1);
}

for (let u = 2; u <= 1 + macroInfluencerCount; u++) {
    friendsCountEstimates[u] = Math.min(getRandomInt(100000, 300000), userCount - 1);
}

for (let u = 2 + macroInfluencerCount; u <= totalInfluencers; u++) {
    friendsCountEstimates[u] = Math.min(getRandomInt(5000, 30000), userCount - 1);
}

for (let u = totalInfluencers + 1; u <= userCount; u++) {
    const rand = Math.random();
    if (rand < 0.05) {
        friendsCountEstimates[u] = Math.min(getRandomInt(0, 50), userCount - 1);
    } else if (rand < 0.90) {
        friendsCountEstimates[u] = Math.min(getRandomInt(250, 750), userCount - 1);
    } else {
        friendsCountEstimates[u] = Math.min(getRandomInt(1000, 2000), userCount - 1);
    }
}

console.log("Writing user and user_profile records via streaming pipeline...");
const batchSize = 1000;

for (let i = 1; i <= userCount; i += batchSize) {
    const endIdx = Math.min(i + batchSize - 1, userCount);
    const userValues = [];
    const profileValues = [];

    for (let u = i; u <= endIdx; u++) {
        let nickname = "";
        if (u === 1) {
            nickname = "mega_influencer_1";
        } else if (u <= 1 + macroInfluencerCount) {
            nickname = `macro_influencer_${u}`;
        } else if (u <= totalInfluencers) {
            nickname = `influencer_user_${u}`;
        } else {
            nickname = `normal_user_${u}`;
        }

        const email = `${nickname}@trit.com`;
        const pwdHash = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF";
        const fCount = friendsCountEstimates[u];

        userValues.push(`(${u}, 1, 1, '${email}', '${pwdHash}', '${nickname}', NULL, NOW(), NOW())`);
        profileValues.push(`(${u}, 'Bio of ${nickname}', 'Intro of ${nickname}', 1, 'Travel style summary', 1, NULL, 1, ${fCount}, NOW(), NOW())`);
    }

    writeStream.write("INSERT INTO user (id, role_id, status_id, email, password_hash, nickname, profile_image_url, created_at, updated_at) VALUES\n");
    writeStream.write(userValues.join(",\n") + ";\n");

    writeStream.write("INSERT INTO user_profile (user_id, bio, intro, home_region_id, travel_style_summary, travel_style_id, profile_banner_url, is_profile_public, friends_count, created_at, updated_at) VALUES\n");
    writeStream.write(profileValues.join(",\n") + ";\n\n");
}

console.log("Writing bidirectional friendship network via streaming chunks...");
let friendshipPairs = [];

function flushFriendships() {
    if (friendshipPairs.length > 0) {
        writeStream.write("INSERT IGNORE INTO friendship (user_id_a, user_id_b, created_at) VALUES\n");
        writeStream.write(friendshipPairs.join(",\n") + ";\n");
        friendshipPairs = [];
    }
}

if (userCount > 1) {
    const megaLimit = Math.min(1000000, userCount - 1);
    for (let target = 2; target <= 1 + megaLimit; target++) {
        friendshipPairs.push(`(1, ${target}, NOW())`);
        friendshipPairs.push(`(${target}, 1, NOW())`);
        if (friendshipPairs.length >= batchSize) {
            flushFriendships();
        }
    }
}

for (let inf = 2; inf <= 1 + macroInfluencerCount; inf++) {
    const targetSize = friendsCountEstimates[inf];
    const step = Math.max(1, Math.floor(userCount / targetSize));
    let connected = 0;
    for (let t = 2; t <= userCount && connected < targetSize; t += step) {
        if (t !== inf) {
            friendshipPairs.push(`(${inf}, ${t}, NOW())`);
            friendshipPairs.push(`(${t}, ${inf}, NOW())`);
            connected++;
            if (friendshipPairs.length >= batchSize) {
                flushFriendships();
            }
        }
    }
}

const normalSampleCount = Math.min(userCount, 10000);
for (let u = totalInfluencers + 1; u <= normalSampleCount; u++) {
    const targetCount = Math.min(friendsCountEstimates[u], 50);
    const clusterEnd = Math.min(userCount, u + targetCount);
    for (let target = u + 1; target <= clusterEnd; target++) {
        friendshipPairs.push(`(${u}, ${target}, NOW())`);
        friendshipPairs.push(`(${target}, ${u}, NOW())`);
        if (friendshipPairs.length >= batchSize) {
            flushFriendships();
        }
    }
}

flushFriendships();
writeStream.write("\n");

console.log("Generating trips, logs, algorithm-viral likes, and organic comments...");
let globalTripId = 0;
let globalLogId = 0;
let globalLikeId = 0;
let globalCommentId = 0;
const nowMs = Date.now();

let tripBatch = [];
let logBatch = [];
let likeBatch = [];
let commentBatch = [];

function flushContentBatches() {
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
        writeStream.write("INSERT IGNORE INTO log_like (user_id, log_id, created_at) VALUES\n");
        writeStream.write(likeBatch.join(",\n") + ";\n");
        likeBatch = [];
    }
    if (commentBatch.length > 0) {
        writeStream.write("INSERT INTO log_comment (id, log_id, user_id, parent_id, content, is_deleted, created_at, updated_at) VALUES\n");
        writeStream.write(commentBatch.join(",\n") + ";\n");
        commentBatch = [];
    }
}

const contentAuthorLimit = Math.min(userCount, 1000);

for (let u = 1; u <= contentAuthorLimit; u++) {
    const activityRand = Math.random();
    let userLogCount = 0;
    if (activityRand < 0.30) {
        userLogCount = getRandomInt(1, 2);
    } else if (activityRand < 0.90) {
        userLogCount = getRandomInt(5, 15);
    } else {
        userLogCount = getRandomInt(20, 50);
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
            flushContentBatches();
        }
    }

    const followersCount = friendsCountEstimates[u];

    for (let l = 0; l < userLogCount; l++) {
        globalLogId++;
        const currentLogId = globalLogId;
        const matchingTripId = userTripIds[l];
        const daysAgo = getRandomInt(0, 14);
        const logDate = new Date(nowMs - (daysAgo * 86400000 + getRandomInt(0, 86400000)));
        const isoDate = logDate.toISOString().slice(0, 19).replace('T', ' ');

        logBatch.push(`(${currentLogId}, ${matchingTripId}, 'Trip Log ${currentLogId}', 'Content of trip log ${currentLogId} by user ${u}', 'PUBLIC', '${isoDate}', '${isoDate}')`);

        const isViralPost = Math.random() < 0.03;
        const isDeadPost = Math.random() < 0.25;

        if (!isDeadPost) {
            let likeCount = 0;
            let commentCount = 0;

            if (isViralPost) {
                likeCount = Math.min(getRandomInt(100, 300), userCount - 1);
                commentCount = Math.min(getRandomInt(20, 50), userCount - 1);
            } else if (followersCount > 0) {
                const likeRate = (getRandomInt(1, 5)) / 100;
                likeCount = Math.min(Math.floor(followersCount * likeRate), 50, userCount - 1);
                const commentRate = (getRandomInt(1, 3)) / 1000;
                commentCount = Math.min(Math.floor(followersCount * commentRate), 10, userCount - 1);
            }

            const stepLike = Math.max(1, Math.floor(userCount / Math.max(1, likeCount)));
            let likersAdded = 0;
            for (let liker = 1; liker <= userCount && likersAdded < likeCount; liker += stepLike) {
                if (liker !== u) {
                    globalLikeId++;
                    likeBatch.push(`(${liker}, ${currentLogId}, '${isoDate}')`);
                    likersAdded++;
                    if (likeBatch.length >= batchSize) {
                        flushContentBatches();
                    }
                }
            }

            const stepComment = Math.max(1, Math.floor(userCount / Math.max(1, commentCount)));
            let commentersAdded = 0;
            for (let commenter = 1; commenter <= userCount && commentersAdded < commentCount; commenter += stepComment) {
                if (commenter !== u) {
                    globalCommentId++;
                    commentBatch.push(`(${globalCommentId}, ${currentLogId}, ${commenter}, NULL, 'Comment ${globalCommentId} on log ${currentLogId}', 0, '${isoDate}', '${isoDate}')`);
                    commentersAdded++;
                    if (commentBatch.length >= batchSize) {
                        flushContentBatches();
                    }
                }
            }
        }

        if (logBatch.length >= batchSize || tripBatch.length >= batchSize) {
            flushContentBatches();
        }
    }
}

flushContentBatches();

writeStream.write("COMMIT;\n");
writeStream.write("SET FOREIGN_KEY_CHECKS = 1;\n");
writeStream.write("SET UNIQUE_CHECKS = 1;\n");
writeStream.write("SET autocommit = 1;\n\n");

writeStream.end(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Benchmark SQL generated at ${outputPath} in ${elapsedSec}s.`);
    console.log(`Summary: TotalUsers=${userCount}, Trips=${globalTripId}, Logs=${globalLogId}, Likes=${globalLikeId}, Comments=${globalCommentId}`);
});
