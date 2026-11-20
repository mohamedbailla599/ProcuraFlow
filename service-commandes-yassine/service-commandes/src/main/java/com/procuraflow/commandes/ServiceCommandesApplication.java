package com.procuraflow.commandes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ServiceCommandesApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServiceCommandesApplication.class, args);
		System.out.println("Bonjour le monde !");
	}

}
