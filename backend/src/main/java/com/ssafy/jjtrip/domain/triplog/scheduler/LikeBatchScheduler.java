package com.ssafy.jjtrip.domain.triplog.scheduler;

import com.ssafy.jjtrip.common.util.RedisUtil;
import com.ssafy.jjtrip.domain.notification.entity.NotificationType;
import com.ssafy.jjtrip.domain.notification.service.NotificationService;
import com.ssafy.jjtrip.domain.triplog.mapper.TripLogMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LikeBatchScheduler {

    private final RedisUtil redisUtil;
    private final TripLogMapper tripLogMapper;
    private final NotificationService notificationService;

    private static final String DIRTY_LOGS_KEY = "like:dirty_logs";
    private static final String BUFFER_PREFIX = "like:buffer:";
    private static final String COOLDOWN_PREFIX = "notif:cooldown:like:";
    private static final long COOLDOWN_SECONDS = 1800;

    @Scheduled(fixedDelay = 3000)
    public void flushLikeBuffers() {
        Set<String> dirtyLogs = redisUtil.smembers(DIRTY_LOGS_KEY);
        if (dirtyLogs == null || dirtyLogs.isEmpty()) {
            return;
        }

        for (String logIdStr : dirtyLogs) {
            try {
                Long logId = Long.parseLong(logIdStr);
                String bufferKey = BUFFER_PREFIX + logId;
                if (!redisUtil.hasKey(bufferKey)) {
                    redisUtil.srem(DIRTY_LOGS_KEY, logIdStr);
                    continue;
                }

                String processingKey = bufferKey + ":processing:" + System.currentTimeMillis();
                if (!redisUtil.rename(bufferKey, processingKey)) {
                    redisUtil.srem(DIRTY_LOGS_KEY, logIdStr);
                    continue;
                }

                Map<Object, Object> buffer = redisUtil.hgetAll(processingKey);
                redisUtil.delete(processingKey);
                redisUtil.srem(DIRTY_LOGS_KEY, logIdStr);

                if (buffer == null || buffer.isEmpty()) {
                    continue;
                }

                List<Long> likeUserIds = new ArrayList<>();
                List<Long> unlikeUserIds = new ArrayList<>();

                for (Map.Entry<Object, Object> entry : buffer.entrySet()) {
                    Long userId = Long.parseLong(entry.getKey().toString());
                    String action = entry.getValue().toString();
                    if ("LIKE".equals(action)) {
                        likeUserIds.add(userId);
                    } else if ("UNLIKE".equals(action)) {
                        unlikeUserIds.add(userId);
                    }
                }

                if (!likeUserIds.isEmpty()) {
                    tripLogMapper.insertLikesBatch(logId, likeUserIds);
                }
                if (!unlikeUserIds.isEmpty()) {
                    tripLogMapper.deleteLikesBatch(logId, unlikeUserIds);
                }

                for (Long userId : unlikeUserIds) {
                    notificationService.retractLikeNotification(userId, logId);
                }

                Long authorId = tripLogMapper.findAuthorIdByLogId(logId).orElse(null);
                if (authorId != null) {
                    for (Long userId : likeUserIds) {
                        if (userId.equals(authorId)) {
                            continue;
                        }
                        String cooldownKey = COOLDOWN_PREFIX + userId + ":" + logId;
                        boolean isFirstNotification = redisUtil.setIfAbsent(cooldownKey, "1", COOLDOWN_SECONDS);
                        if (isFirstNotification) {
                            notificationService.send(userId, authorId, NotificationType.LIKE, null, logId, "/triplog/" + logId);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to flush like buffer for log {}", logIdStr, e);
            }
        }
    }
}
