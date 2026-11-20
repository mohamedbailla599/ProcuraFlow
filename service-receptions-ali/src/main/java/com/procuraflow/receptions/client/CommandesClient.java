package com.procuraflow.receptions.client;

import com.procuraflow.receptions.client.dto.CommandeResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CommandesClient {

    private final RestClient restClient;

    public CommandesClient(
            RestClient.Builder builder,
            @Value("${services.commandes.url}") String commandesUrl
    ) {
        SimpleClientHttpRequestFactory requestFactory =
                new SimpleClientHttpRequestFactory();

        requestFactory.setConnectTimeout(3000);
        requestFactory.setReadTimeout(5000);

        this.restClient = builder
                .baseUrl(commandesUrl)
                .requestFactory(requestFactory)
                .build();
    }

    public CommandeResponse obtenirCommande(Long commandeId) {
        if (commandeId == null || commandeId <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "L'identifiant de commande doit être strictement positif."
            );
        }

        CommandeResponse commande;

        try {
            commande = restClient.get()
                    .uri("/api/commandes/{id}", commandeId)
                    .retrieve()
                    .body(CommandeResponse.class);
        } catch (HttpClientErrorException.NotFound exception) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Commande introuvable : " + commandeId,
                    exception
            );
        } catch (ResourceAccessException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Le service Commandes est inaccessible ou ne répond pas à temps.",
                    exception
            );
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Impossible d'obtenir une réponse exploitable du service Commandes.",
                    exception
            );
        }

        if (commande == null || !commandeId.equals(commande.id())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Le service Commandes a renvoyé une réponse incohérente."
            );
        }

        return commande;
    }
}