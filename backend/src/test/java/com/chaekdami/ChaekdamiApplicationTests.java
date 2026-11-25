package com.chaekdami;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/** 환경변수나 실제 DB 없이 앱이 뜨는지 확인한다. H2라서 PostgreSQL 연결은 확인하지 않는다 (TODO-21). */
@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:context;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.username=sa", "spring.datasource.password=",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
		"spring.jpa.properties.hibernate.show_sql=false",
		"jwt.secret=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
		"MAIL_PASSWORD=test", "reading.ocr.provider=mock"})
class ChaekdamiApplicationTests {

	@Test
	void contextLoads() {
	}

}
