# Praca nad Kumilo

Kumilo łączy prosty interfejs z treściami edukacyjnymi zapisanymi w JSON. Zmiany powinny zachowywać ten podział: nowe zadanie w istniejącym formacie trafia do `data/`, a poprawa sposobu jego wyświetlania do `assets/`.

## Co należy do repozytorium

| Element | Dlaczego go wersjonujemy |
| --- | --- |
| `index.html`, `assets/` | Kod aplikacji, style, logo sowy i ilustracje potrzebne do działania strony. |
| `data/` | Publiczne, autorskie treści edukacyjne, katalog i schemat JSON. |
| `scripts/`, `tests/` | Powtarzalne budowanie, walidacja i sprawdzanie zmian. |
| `docs/`, `README.md`, `CONTRIBUTING.md` | Instrukcje obsługi, rozwoju i publikacji. |
| `.github/workflows/` | Automatyczne testy i budowanie artefaktu. |
| `package.json`, `requirements-dev.txt`, `.gitignore` | Polecenia projektu, zależności narzędziowe i reguły wykluczania. |

Testy i dokumentacja należą do Git, nawet jeśli nie trafiają na hosting. `assets/` zawiera źródłowe zasoby strony, a nie wygenerowaną paczkę. Pliki JSON z odpowiedziami są z założenia publiczne i również wymagają wersjonowania.

## Co pozostaje lokalnie

Reguły znajdują się w [`.gitignore`](.gitignore).

| Element | Powód wykluczenia |
| --- | --- |
| `materiały/` | Zdjęcia, skany i archiwa wyznaczające zakres nauki; nie są publicznymi treściami aplikacji. |
| `local-server/` | Prywatny serwer podglądu i jego testy; nie jest częścią projektu do publikacji. |
| `dist/`, `.kumilo-build-*/` | Odtwarzalne wyniki i katalogi robocze budowania. |
| `node_modules/`, `.venv/`, `venv/` | Lokalne zależności i środowiska, odtwarzane na danym stanowisku. |
| `__pycache__/`, `*.py[cod]`, cache narzędzi Python | Pliki generowane automatycznie. |
| `coverage/`, `.nyc_output/`, `playwright-report/`, `test-results/`, `*.log` | Raporty i diagnostyka, nie źródła testów. |
| `.env`, `.env.*` | Lokalne ustawienia, które mogą zawierać sekrety. |
| `.idea/`, `.vscode/`, pliki wymiany i kopie `*~` | Stan edytora i pliki robocze użytkownika. |
| `.DS_Store`, `._*`, `Thumbs.db`, `Desktop.ini` | Metadane systemu operacyjnego. |

Wyjątki `.env.example` i `.env.sample` pozwalają zapisać wzory konfiguracji. Taki wzór może zawierać tylko opisy i bezpieczne wartości przykładowe, nigdy prawdziwe hasła ani tokeny. Aplikacja obecnie nie wymaga pliku `.env`.

Nie ignorujemy wszystkich obrazów, archiwów ani plików JSON po rozszerzeniu: taka reguła mogłaby ukryć potrzebny zasób. Prywatne oryginały trzymaj w `materiały/`, a publiczne ilustracje w `assets/`.

## Kontrola przed dodaniem plików

```sh
git status --short --untracked-files=all
git status --short --ignored
git check-ignore -v dist/index.html local-server/serve.py
```

`git check-ignore -v ścieżka` pokazuje regułę, która wyklucza plik. Brak dopasowania oznacza kod wyjścia 1 i sam w sobie nie jest błędem konfiguracji.

`.gitignore` nie usuwa plików z dysku ani z historii i nie przestaje śledzić plików już dodanych do Git. Nie używaj `git add -f`, aby ominąć te reguły bez świadomej decyzji. Jeśli sekret trafił do historii, samo dodanie reguły nie wystarczy: trzeba go unieważnić i osobno ustalić sposób oczyszczenia historii.

## Zmiany w treściach

1. Na podstawie zakresu nauki opracuj własne objaśnienia, przykłady i zadania. Nie przepisuj materiałów źródłowych 1:1.
2. Zachowaj hierarchię `data/klasa-N/przedmiot/temat/topic.json` i zarejestruj temat w `data/catalog.json`.
3. Stosuj [kontrakt JSON](docs/data-format.md). Nie umieszczaj w nim HTML, JavaScript, danych uczniów ani sekretów.
4. Zachowuj istniejące identyfikatory, jeśli znaczenie elementu się nie zmienia. Postęp ucznia odwołuje się do identyfikatorów zadań i lekcji.
5. Sprawdź treść merytorycznie. Poprawna walidacja nie dowodzi poprawności wyjaśnień.

## Zmiany w interfejsie

- Zachowaj wspólną [sowę Kumilo](docs/branding.md), zamiast tworzyć osobne logo dla każdego tematu.
- Preferuj krótkie instrukcje i działanie. Dłuższe objaśnienia powinny być dostępne wtedy, gdy uczeń ich potrzebuje.
- Nie ujawniaj poprawności odpowiedzi w trakcie testu. Omówienie pojawia się po zatwierdzeniu całości.
- Zachowaj obsługę klawiatury i strzałkową alternatywę dla przeciągania. Sprawdzaj widok mobilny oraz stany pustych i niedostępnych danych.
- Nie dodawaj zależności ani zewnętrznych usług bez uzasadnienia. Obecna aplikacja korzysta z lokalnych zasobów.

## Weryfikacja zmian

Przygotowanie środowiska opisuje [README](README.md#uruchomienie). Z katalogu projektu uruchom:

```sh
npm test
npm run build
```

Pierwsze polecenie sprawdza logikę JavaScript, walidator Python i rzeczywiste dane. Drugie odtwarza paczkę `dist/`; nie publikuje jej w internecie.

Osobno sprawdź naukę, test, wynik, powtórkę, zapis postępu i usuwanie danych w przeglądarce. Scenariusze `tests/browser-checks.mjs` i `tests/review-regressions.mjs` nie są automatycznie uruchamiane przez `npm test` ani obecny workflow CI. Symulowane zdarzenia dotykowe nie zastępują próby na fizycznym telefonie.

Jeśli zmieniasz prywatny serwer lokalny, jego dodatkowy zestaw testów jest dostępny tylko na stanowisku, które zawiera `local-server/`:

```sh
python3 -m unittest discover -s local-server/tests -v
```

Przed zatwierdzeniem zmian przejrzyj listę dodawanych plików i ich różnice. Nie edytuj ręcznie `dist/`; popraw źródła i ponów budowanie. Repozytorium i paczka na hosting mają różne zakresy: instrukcję wdrożenia opisuje [publikacja](docs/publication.md).
