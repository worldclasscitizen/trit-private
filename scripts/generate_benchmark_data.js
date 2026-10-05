import fs from 'fs';
import path from 'path';

const userCount = parseInt(process.argv[2] || '5000', 10);
const logCount = parseInt(process.argv[3] || '50000', 10);
const outputPath = process.argv[4] || path.join('scripts', 'benchmark_data.sql');

const startTime = Date.now();
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' });

writeStream.write("SET FOREIGN_KEY_CHECKS = 0;\n");
writeStream.write("TRUNCATE TABLE trip_log;\n");
writeStream.write("TRUNCATE TABLE trip_item;\n");
writeStream.write("TRUNCATE TABLE trip;\n");
writeStream.write("TRUNCATE TABLE friendship;\n");
writeStream.write("TRUNCATE TABLE user_profile;\n");
writeStream.write("TRUNCATE TABLE user;\n");
writeStream.write("SET FOREIGN_KEY_CHECKS = 1;\n\n");

console.log(`Generating ${userCount} users...`);
const batchSize = 1000;

for (let i = 1; i <= userCount; i += batchSize) {
    const endIdx = Math.min(i + batchSize - 1, userCount);
    const userValues = [];
    const profileValues = [];

    for (let u = i; u <= endIdx; u++) {
        const email = `benchmark_user_${u}@trit.com`;
        const pwdHash = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEF";
        const nickname = `User_${u}`;
        userValues.push(`(${u}, 1, 1, '${email}', '${pwdHash}', '${nickname}', NULL, NOW(), NOW())`);
        profileValues.push(`(${u}, 'Bio of user ${u}', 'Intro ${u}', 1, 'Summary ${u}', 1, NULL, 1, 0, NOW(), NOW())`);
    }

    writeStream.write("INSERT INTO user (id, role_id, status_id, email, password_hash, nickname, profile_image_url, created_at, updated_at) VALUES\n");
    writeStream.write(userValues.join(",\n") + ";\n");

    writeStream.write("INSERT INTO user_profile (user_id, bio, intro, home_region_id, travel_style_summary, travel_style_id, profile_banner_url, is_profile_public, friends_count, created_at, updated_at) VALUES\n");
    writeStream.write(profileValues.join(",\n") + ";\n\n");
}

console.log("Generating friendship relationships (Pareto distribution)...");
const friendshipSet = new Set();
const influencerCount = Math.max(1, Math.floor(userCount * 0.02));

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleUnique(sourceMax, count, exclude) {
    const selected = new Set();
    const targetSize = Math.min(count, sourceMax - 1);
    while (selected.size < targetSize) {
        const candidate = getRandomInt(1, sourceMax);
        if (candidate !== exclude) {
            selected.add(candidate);
        }
    }
    return Array.from(selected);
}

for (let u = 1; u <= influencerCount; u++) {
    const targets = sampleUnique(userCount, Math.min(500, userCount - 1), u);
    for (const target of targets) {
        const a = Math.min(u, target);
        const b = Math.max(u, target);
        friendshipSet.add(`${a},${b}`);
    }
}

for (let u = influencerCount + 1; u <= userCount; u++) {
    const targetCount = getRandomInt(10, 30);
    const targets = sampleUnique(userCount, targetCount, u);
    for (const target of targets) {
        const a = Math.min(u, target);
        const b = Math.max(u, target);
        friendshipSet.add(`${a},${b}`);
    }
}

const friendshipList = Array.from(friendshipSet);
for (let i = 0; i < friendshipList.length; i += batchSize) {
    const chunk = friendshipList.slice(i, i + batchSize);
    const vals = chunk.map(pair => `(${pair}, NOW())`);
    writeStream.write("INSERT INTO friendship (user_id_a, user_id_b, created_at) VALUES\n");
    writeStream.write(vals.join(",\n") + ";\n");
}
writeStream.write("\n");

console.log(`Generating ${logCount} trips and trip logs...`);
const nowMs = Date.now();

for (let i = 1; i <= logCount; i += batchSize) {
    const endIdx = Math.min(i + batchSize - 1, logCount);
    const tripValues = [];
    const logValues = [];

    for (let l = i; l <= endIdx; l++) {
        const authorId = getRandomInt(1, userCount);
        const daysAgo = getRandomInt(0, 14);
        const logDate = new Date(nowMs - (daysAgo * 86400000 + getRandomInt(0, 86400000)));
        const isoString = logDate.toISOString().slice(0, 19).replace('T', ' ');

        tripValues.push(`(${l}, ${authorId}, 3, 'Trip Title ${l}', '2026-01-01', '2026-01-05', 'PUBLIC', 'Seoul, Korea', '${isoString}', '${isoString}')`);
        logValues.push(`(${l}, ${l}, 'Trip Log Title ${l}', 'Content of trip log ${l}', 'PUBLIC', '${isoString}', '${isoString}')`);
    }

    writeStream.write("INSERT INTO trip (id, user_id, trip_status_id, title, start_date, end_date, visibility, location_summary, created_at, updated_at) VALUES\n");
    writeStream.write(tripValues.join(",\n") + ";\n");

    writeStream.write("INSERT INTO trip_log (id, trip_id, title, content, visibility, created_at, updated_at) VALUES\n");
    writeStream.write(logValues.join(",\n") + ";\n\n");
}

writeStream.end(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Benchmark SQL generated at ${outputPath} in ${elapsedSec}s.`);
});
