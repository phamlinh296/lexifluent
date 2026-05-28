package org.linh.lexi.ai.prompt;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PromptLoader {

    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public String load(String relativePath) {
        return cache.computeIfAbsent(relativePath, this::read);
    }

    private String read(String path) {
        try {
            return new ClassPathResource("prompts/" + path)
                    .getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Prompt file missing: prompts/" + path, ex);
        }
    }
}
