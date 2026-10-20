package com.ssafy.jjtrip.common.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.Key;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class LoadTestTokenGenerator {

    private static final String SECRET_KEY =
            "ff2b8da9e84f6ecb2e7dc085a47d68cd221477ac8c744f7dc3ef9ae6e5f1723e167cd72b5698c3d0a8d8af94e4111fc02893ee953264357a18df856fe92a7059";
    private static final long EXPIRE_TIME = 864000000L;

    public static void main(String[] args) throws Exception {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        Key key = Keys.hmacShaKeyFor(keyBytes);

        String dbUrl = "jdbc:mysql://localhost:3307/trit_dev?serverTimezone=Asia/Seoul&characterEncoding=UTF-8";
        String dbUser = "trit";
        String dbPass = "tritpassword";

        List<String> tokens = new ArrayList<>();

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, email, nickname FROM user WHERE email LIKE 'normal_user_%@trit.com' ORDER BY id ASC LIMIT 1500")) {

            Date now = new Date();
            Date expiry = new Date(now.getTime() + EXPIRE_TIME);

            while (rs.next()) {
                long id = rs.getLong("id");
                String email = rs.getString("email");
                String nickname = rs.getString("nickname");

                String token = Jwts.builder()
                        .setSubject(email)
                        .claim("id", id)
                        .claim("nickname", nickname)
                        .claim("role", "USER")
                        .setIssuedAt(now)
                        .setExpiration(expiry)
                        .signWith(key)
                        .compact();

                tokens.add(token);
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("[\n");
        for (int i = 0; i < tokens.size(); i++) {
            sb.append("  \"").append(tokens.get(i)).append("\"");
            if (i < tokens.size() - 1) {
                sb.append(",\n");
            } else {
                sb.append("\n");
            }
        }
        sb.append("]\n");

        String outputPath = "C:/Users/최진우/.gemini/antigravity/scratch/trit-private/load-tests/tokens_1500.json";
        Files.writeString(Paths.get(outputPath), sb.toString());
        System.out.println("GENERATED_TOKENS_COUNT=" + tokens.size());
    }
}
