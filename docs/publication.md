# Pierwsza publikacja Kumilo 0.1.0

## Co jest wydaniem

Wyłącznie zawartość katalogu `dist/` wygenerowanego przez `npm run build`. Sam build nie wysyła nic do internetu, nie tworzy commita ani taga.

```text
dist/

├── .nojekyll
├── index.html
├── assets/
└── data/
```

Do paczki nie trafiają oryginały z `materiały/`, narzędzia Python, testy, dokumentacja, metadane Git ani konfiguracja CI. Skrypt kopiuje tylko dozwolone zasoby. Pomija katalogi `.idea`, `.vscode`, `__pycache__` i pliki `.DS_Store` bez odczytywania ich treści. Odrzuca wszystkie dowiązania symboliczne, inne pliki ukryte w zasobach oraz nieobsługiwane rozszerzenia, zamiast publikować je po cichu. Pliki JSON w `data/` muszą zawierać tylko publiczne treści edukacyjne, nigdy dane osobowe i sekrety.

`dist/` jest ignorowany przez Git i odtwarzany przy budowaniu. Nie przechowuj w nim ręcznych zmian — kolejne budowanie je zastąpi.

## Przygotowanie

1. Zainstaluj narzędzia deweloperskie: Node.js 22+ i Python 3.10+.
2. Zainstaluj zależności walidacji: `python3 -m pip install -r requirements-dev.txt`.
3. Uruchom `npm test`.
4. Uruchom `npm run build`.
5. Obejrzyj **zbudowaną paczkę** przez HTTP, nie tylko źródłowy katalog projektu. Weryfikuj wybór materiału, pełną naukę, test, wynik i powtórkę.
6. Przejrzyj materiał merytorycznie. Walidator sprawdza strukturę i odwołania, nie potwierdza poprawności dydaktycznej każdego zdania.

Do samego budowania wystarcza Node (`npm run build`); Python jest potrzebny do pełnego zestawu testów i walidacji przed wydaniem. Do działania opublikowanej strony nie potrzeba żadnego z tych narzędzi na komputerze odbiorcy.

## Hosting

Przenieś zawartość `dist/` na hosting statyczny, zachowując ścieżki i wielkość liter. Przykłady adresów: `https://twoja-domena/` lub `https://twoja-domena/kumilo/`. Otwieraj podkatalog z końcowym ukośnikiem (`/kumilo/`), aby względne adresy wskazywały właściwe zasoby.

Hosting powinien:
- obsługiwać HTTPS;
- udostępniać `index.html` jako stronę katalogu;
- zwracać poprawne typy MIME dla `.js` (`text/javascript` albo `application/javascript`), CSS, SVG i JSON;
- zwracać 404 dla brakujących plików, a nie przekierowywać żądań JSON na HTML;
- nie wymagać przepisywania tras jak w routerze SPA — Kumilo nie używa takich tras.

Nie wgrywaj całego repozytorium. Samo ignorowanie pliku przez Git nie zabezpiecza przed jego udostępnieniem na źle skonfigurowanym serwerze HTTP.

Plik `.nojekyll` ułatwia publikowanie bez przetwarzania przez Jekyll. Nie jest konfiguracją wdrożenia GitHub Pages. Workflow CI jedynie buduje i przechowuje artefakt — docelowy hosting i ewentualny workflow wdrożeniowy trzeba wybrać przed faktyczną publikacją.

### Apache / OVH: ekran „Sowa otwiera bibliotekę…”

Na kumilo.pl stwierdzono brak nagłówka `Content-Type` dla `.mjs`: HTTP 200 nie wystarcza, a przeglądarka odrzuca takie moduły. Próba ustawienia typu przez `.htaccess` nie przyniosła potwierdzonej zmiany na serwerze.

Paczka nie zależy już od konfiguracji tego rozszerzenia: build zapisuje źródłowe moduły `.mjs` jako `.js`, poprawia lokalne importy i odwołanie w `index.html`. Źródła pozostają bez zmian. Nie publikuje konfiguracji `.htaccess` i nie wymaga jej nadpisywania.

Wgraj nowy `dist/index.html` i zawartość `dist/assets/` do `/www/`, zachowując istniejącą konfigurację hostingu. Stare `.mjs` nie są już używane przez nowy HTML. Sprawdź `curl -I https://kumilo.pl/assets/app.js`: oczekiwany typ to `text/javascript` albo `application/javascript` (opcjonalnie z kodowaniem). Odśwież stronę z pominięciem pamięci podręcznej. Nie wyłączaj zabezpieczeń MIME przeglądarki.

## Kontrola po wgraniu

- Logo i maskotka ładują się z tego samego `assets/owl.svg`.
- W narzędziach sieciowych przeglądarki nie ma błędów plików JS, CSS, SVG ani JSON.
- Katalog i temat działają również pod docelowym podkatalogiem.
- Nauka kończy się podsumowaniem, test daje wynik i omówienie.
- Odświeżenie zachowuje ukończone aktywności.
- „Usuń zapisane dane Kumilo” usuwa tylko własny wpis.
- Na telefonie sprawdź dotyk, przeciąganie i alternatywę strzałkową.
- Wydruk wyniku jest czytelny.

## Dane i ograniczenia

Postęp jest przechowywany w profilu przeglądarki dla danego originu. Przejście z localhost na domenę nie przenosi postępu. Różne publikacje Kumilo na tym samym originie współdzielą klucz pamięci — podkatalog nie tworzy osobnego profilu ucznia.

Klucz odpowiedzi jest publiczny; aplikacja nie jest systemem egzaminacyjnym. Nie zapisuje pola z imieniem ucznia i nie wysyła wyników do backendu. Lokalny zapis może być widoczny dla innych osób korzystających z tego samego profilu przeglądarki. Hosting może prowadzić własne logi dostępu niezależnie od aplikacji.

Nie dodano automatycznie licencji udzielającej praw do kodu lub treści. Przed publicznym udostępnieniem właściciel powinien ustalić zasady ich wykorzystania.

## Następne wydania

Nie edytuj plików bezpośrednio w `dist/`. Zmień źródła lub JSON, uruchom testy i build, a następnie zastąp całą paczkę na hostingu. Zachowuj zgodność `schemaVersion` opisaną w `docs/data-format.md`. Zmiana wersji aplikacji w `package.json` nie zmienia automatycznie schematu danych.
