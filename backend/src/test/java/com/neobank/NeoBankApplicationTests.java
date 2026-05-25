package com.neobank;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class NeoBankApplicationTests {

    @Test
    void contextLoads() {
        // Verifies the Spring context starts successfully with all beans
    }
}
