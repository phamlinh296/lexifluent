package org.linh.lexi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LexiApplication {

    public static void main(String[] args) {
        SpringApplication.run(LexiApplication.class, args);
    }

}
