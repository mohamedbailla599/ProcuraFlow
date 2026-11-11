package com.procuraflow.fournisseurs.service;

import com.procuraflow.fournisseurs.client.CommandesClient;
import com.procuraflow.fournisseurs.dto.CommandeSummaryResponse;
import com.procuraflow.fournisseurs.dto.FournisseurRequest;
import com.procuraflow.fournisseurs.dto.FournisseurResponse;
import com.procuraflow.fournisseurs.dto.FournisseurStatsResponse;
import com.procuraflow.fournisseurs.dto.PageResponse;
import com.procuraflow.fournisseurs.entity.Fournisseur;
import com.procuraflow.fournisseurs.exception.DuplicateEmailException;
import com.procuraflow.fournisseurs.exception.FournisseurNotFoundException;
import com.procuraflow.fournisseurs.repository.FournisseurRepository;
import jakarta.persistence.criteria.Predicate;
import java.text.Collator;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class FournisseurService {

    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 50;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "nom", "email", "createdAt", "updatedAt", "id", "actif"
    );

    private static final Set<String> TEXT_SORT_FIELDS = Set.of("nom", "email");

    private static final List<String> KNOWN_CITIES = List.of(
            "Casablanca", "Rabat", "Tanger", "Marrakech", "Agadir", "Fès", "Meknès",
            "Oujda", "Kénitra", "Tétouan", "Salé", "Mohammédia", "El Jadida", "Nador",
            "Béni Mellal", "Laâyoune", "Dakhla", "Paris", "Lyon", "Marseille"
    );

    private static final Map<String, List<String>> CITY_VARIANTS = Map.ofEntries(
            Map.entry("fes", List.of("fes", "fès")),
            Map.entry("kenitra", List.of("kenitra", "kénitra")),
            Map.entry("meknes", List.of("meknes", "meknès")),
            Map.entry("tetouan", List.of("tetouan", "tétouan")),
            Map.entry("sale", List.of("sale", "salé")),
            Map.entry("beni mellal", List.of("beni mellal", "béni mellal")),
            Map.entry("mohammedia", List.of("mohammedia", "mohammédia")),
            Map.entry("laayoune", List.of("laayoune", "laâyoune")),
            Map.entry("al hoceima", List.of("al hoceima", "al hoceïma")),
            Map.entry("temara", List.of("temara", "témara")),
            Map.entry("khemisset", List.of("khemisset", "khémisset")),
            Map.entry("seville", List.of("seville", "séville")),
            Map.entry("geneve", List.of("geneve", "genève")),
            Map.entry("montreal", List.of("montreal", "montréal"))
    );

    private final FournisseurRepository fournisseurRepository;
    private final CommandesClient commandesClient;

    public FournisseurService(
            FournisseurRepository fournisseurRepository,
            CommandesClient commandesClient
    ) {
        this.fournisseurRepository = fournisseurRepository;
        this.commandesClient = commandesClient;
    }

    @Transactional
    public FournisseurResponse createFournisseur(FournisseurRequest request) {
        validateRequest(request);
        String normalizedEmail = normalizeEmail(request.email());

        if (fournisseurRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateEmailException(normalizedEmail);
        }

        Fournisseur fournisseur = new Fournisseur(
                request.nom().trim(),
                normalizedEmail,
                request.telephone(),
                request.adresse()
        );
        fournisseur.setActif(Boolean.TRUE);

        Fournisseur saved = fournisseurRepository.saveAndFlush(fournisseur);
        return FournisseurResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<FournisseurResponse> listFournisseurs(
            Boolean actif,
            String nom,
            String email,
            Boolean includeInactive
    ) {
        return listFournisseurs(actif, null, nom, email, null, includeInactive, null);
    }

    /**
     * Retourne la liste complète (sans pagination) correspondant aux filtres et au tri demandés.
     */
    @Transactional(readOnly = true)
    public List<FournisseurResponse> listFournisseurs(
            Boolean actif,
            String search,
            String nom,
            String email,
            String ville,
            Boolean includeInactive,
            String sort
    ) {
        Specification<Fournisseur> spec = buildFilterSpecification(
                actif, search, nom, email, ville, includeInactive
        );
        Sort resolvedSort = StringUtils.hasText(sort)
                ? resolveSort(sort)
                : Sort.by(Sort.Direction.ASC, "id");

        return fournisseurRepository.findAll(spec, resolvedSort)
                .stream()
                .map(FournisseurResponse::fromEntity)
                .toList();
    }

    /**
     * Liste paginée avec filtrage et tri appliqués en base avant la pagination.
     */
    @Transactional(readOnly = true)
    public PageResponse<FournisseurResponse> listFournisseursPaginated(
            Boolean actif,
            String search,
            String nom,
            String email,
            String ville,
            Boolean includeInactive,
            int page,
            int size,
            String sort
    ) {
        if (page < 0) {
            throw new IllegalArgumentException("Le numéro de page doit être supérieur ou égal à 0.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "La taille de page doit être comprise entre 1 et " + MAX_PAGE_SIZE + "."
            );
        }

        Sort resolvedSort = resolveSort(sort);
        Pageable pageable = PageRequest.of(page, size, resolvedSort);
        Specification<Fournisseur> spec = buildFilterSpecification(
                actif, search, nom, email, ville, includeInactive
        );

        Page<FournisseurResponse> mappedPage = fournisseurRepository
                .findAll(spec, pageable)
                .map(FournisseurResponse::fromEntity);

        return PageResponse.from(mappedPage);
    }

    /**
     * Retourne les statistiques globales sur l'ensemble du catalogue en base,
     * indépendamment de la page affichée.
     */
    @Transactional(readOnly = true)
    public FournisseurStatsResponse getGlobalStats() {
        long total = fournisseurRepository.count();
        long actifs = fournisseurRepository.countByActifTrue();
        long inactifs = Math.max(0L, total - actifs);
        int tauxEligibilite = total > 0 ? (int) Math.round((actifs * 100.0) / total) : 0;

        Set<String> citySet = new LinkedHashSet<>();
        List<String> adresses = fournisseurRepository.findDistinctNonNullAdresses();
        if (adresses != null) {
            for (String adresse : adresses) {
                String city = extractCity(adresse);
                if (city != null && city.length() > 1) {
                    citySet.add(city);
                }
            }
        }

        Collator frCollator = Collator.getInstance(Locale.FRENCH);
        frCollator.setStrength(Collator.PRIMARY);
        List<String> sortedCities = citySet.stream()
                .sorted(frCollator)
                .toList();

        return new FournisseurStatsResponse(total, actifs, inactifs, tauxEligibilite, sortedCities);
    }

    private Specification<Fournisseur> buildFilterSpecification(
            Boolean actif,
            String search,
            String nom,
            String email,
            String ville,
            Boolean includeInactive
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (actif != null) {
                predicates.add(cb.equal(root.get("actif"), actif));
            } else if (!Boolean.TRUE.equals(includeInactive)) {
                // Per integration-contract.md Section 5.4: GET /api/fournisseurs excludes inactive suppliers by default
                // unless ?actif=false or ?includeInactive=true is explicitly provided.
                predicates.add(cb.isTrue(root.get("actif")));
            }

            if (StringUtils.hasText(search)) {
                String pattern = "%" + escapeLikePattern(search.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("nom")), pattern, '\\'),
                        cb.like(cb.lower(root.get("email")), pattern, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.get("telephone"), "")), pattern, '\\'),
                        cb.like(cb.lower(cb.coalesce(root.get("adresse"), "")), pattern, '\\')
                ));
            }

            if (StringUtils.hasText(nom)) {
                String pattern = "%" + escapeLikePattern(nom.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.like(cb.lower(root.get("nom")), pattern, '\\'));
            }

            if (StringUtils.hasText(email)) {
                String pattern = "%" + escapeLikePattern(email.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.like(cb.lower(root.get("email")), pattern, '\\'));
            }

            if (StringUtils.hasText(ville)) {
                List<String> variants = expandCityVariants(ville);
                List<Predicate> cityPredicates = new ArrayList<>(variants.size());
                for (String variant : variants) {
                    String pattern = "%" + escapeLikePattern(variant) + "%";
                    cityPredicates.add(
                            cb.like(cb.lower(cb.coalesce(root.get("adresse"), "")), pattern, '\\')
                    );
                }
                predicates.add(cb.or(cityPredicates.toArray(new Predicate[0])));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Sort resolveSort(String sortParam) {
        if (!StringUtils.hasText(sortParam)) {
            return Sort.by(Sort.Order.asc("nom").ignoreCase(), Sort.Order.asc("id"));
        }

        String[] parts = sortParam.trim().split(",");
        String field = parts[0].trim();
        if (!ALLOWED_SORT_FIELDS.contains(field)) {
            throw new IllegalArgumentException("Champ de tri non supporté : '" + field + "'.");
        }

        Sort.Direction direction = Sort.Direction.ASC;
        if (parts.length >= 2 && StringUtils.hasText(parts[1])) {
            String dirToken = parts[1].trim().toLowerCase(Locale.ROOT);
            if ("desc".equals(dirToken)) {
                direction = Sort.Direction.DESC;
            } else if ("asc".equals(dirToken)) {
                direction = Sort.Direction.ASC;
            } else {
                throw new IllegalArgumentException("Direction de tri invalide : '" + dirToken + "'.");
            }
        }

        Sort.Order primaryOrder = new Sort.Order(direction, field);
        if (TEXT_SORT_FIELDS.contains(field)) {
            primaryOrder = primaryOrder.ignoreCase();
        }

        if ("id".equals(field)) {
            return Sort.by(primaryOrder);
        }
        return Sort.by(primaryOrder, Sort.Order.asc("id"));
    }

    private static List<String> expandCityVariants(String ville) {
        String lower = ville.trim().toLowerCase(Locale.ROOT);
        String folded = foldAccents(lower);
        Set<String> variants = new LinkedHashSet<>();
        variants.add(lower);
        variants.add(folded);
        List<String> known = CITY_VARIANTS.get(folded);
        if (known != null) {
            variants.addAll(known);
        }
        return new ArrayList<>(variants);
    }

    private static String extractCity(String adresse) {
        if (!StringUtils.hasText(adresse)) {
            return "";
        }
        String[] parts = adresse.trim().split(",");
        List<String> cleanParts = new ArrayList<>();
        for (String part : parts) {
            String p = part.trim();
            if (!p.isEmpty()) {
                cleanParts.add(p);
            }
        }

        // Scan comma-separated segments from right to left so street prefixes like "Route de Rabat, Tanger"
        // resolve to the actual city ("Tanger").
        for (int i = cleanParts.size() - 1; i >= 0; i--) {
            String foldedSeg = foldAccents(cleanParts.get(i));
            for (String city : KNOWN_CITIES) {
                String foldedCity = foldAccents(city);
                Pattern p = Pattern.compile("\\b" + Pattern.quote(foldedCity) + "\\b", Pattern.CASE_INSENSITIVE);
                Matcher m = p.matcher(foldedSeg);
                if (m.find()) {
                    return city;
                }
            }
        }

        if (cleanParts.size() >= 2) {
            String last = cleanParts.get(cleanParts.size() - 1);
            String lastLower = last.toLowerCase(Locale.ROOT);
            if ("maroc".equals(lastLower) || "france".equals(lastLower) || "morocco".equals(lastLower)) {
                return cleanParts.get(cleanParts.size() - 2).replaceAll("\\d+", "").trim();
            }
            return last.replaceAll("\\d+", "").trim();
        }
        return cleanParts.isEmpty() ? "" : cleanParts.get(0);
    }

    private static String foldAccents(String input) {
        if (input == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(input, Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public FournisseurResponse getFournisseurById(Long id) {
        Fournisseur fournisseur = findEntityOrThrow(id);
        return FournisseurResponse.fromEntity(fournisseur);
    }

    @Transactional
    public FournisseurResponse updateFournisseur(Long id, FournisseurRequest request) {
        validateRequest(request);
        Fournisseur existing = findEntityOrThrow(id);
        String normalizedEmail = normalizeEmail(request.email());

        if (fournisseurRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id)) {
            throw new DuplicateEmailException(normalizedEmail);
        }

        existing.setNom(request.nom().trim());
        existing.setEmail(normalizedEmail);
        existing.setTelephone(request.telephone());
        existing.setAdresse(request.adresse());

        Fournisseur updated = fournisseurRepository.saveAndFlush(existing);
        return FournisseurResponse.fromEntity(updated);
    }

    @Transactional
    public FournisseurResponse deactivateFournisseur(Long id) {
        Fournisseur existing = findEntityOrThrow(id);
        existing.setActif(Boolean.FALSE);
        Fournisseur updated = fournisseurRepository.saveAndFlush(existing);
        return FournisseurResponse.fromEntity(updated);
    }

    @Transactional
    public FournisseurResponse reactivateFournisseur(Long id) {
        Fournisseur existing = findEntityOrThrow(id);
        existing.setActif(Boolean.TRUE);
        Fournisseur updated = fournisseurRepository.saveAndFlush(existing);
        return FournisseurResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<CommandeSummaryResponse> getCommandesByFournisseurId(Long id) {
        if (!fournisseurRepository.existsById(id)) {
            throw new FournisseurNotFoundException(id);
        }
        return commandesClient.getCommandesByFournisseurId(id);
    }

    private Fournisseur findEntityOrThrow(Long id) {
        return fournisseurRepository.findById(id)
                .orElseThrow(() -> new FournisseurNotFoundException(id));
    }

    private static void validateRequest(FournisseurRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("La requête ne peut pas être null");
        }
        if (request.nom() == null || request.nom().isBlank()) {
            throw new IllegalArgumentException("Le nom du fournisseur est obligatoire");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new IllegalArgumentException("L'adresse e-mail du fournisseur est obligatoire");
        }
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String escapeLikePattern(String input) {
        return input
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
