<p align="center">
  <img src="assets/owl.svg" width="150" alt="Sowa Kumilo">
</p>

<h1 align="center">Kumilo</h1>

<p align="center"><strong>Małe odkrycia. Wiedza, która zostaje.</strong><br>Nauka przez zabawę, we własnym tempie, z sową u boku.</p>

<p align="center">
  <a href="#jak-wygląda-nauka">Poznaj Kumilo</a> ·
  <a href="#uruchomienie">Uruchom projekt</a> ·
  <a href="docs/data-format.md">Dodaj treści</a> ·
  <a href="docs/publication.md">Opublikuj stronę</a>
</p>

---

Kumilo to aplikacja edukacyjna dla uczniów szkoły podstawowej. Zamiast zaczynać od długiego tekstu, zaprasza do działania: odwrócenia fiszki, połączenia tropów, uporządkowania wydarzeń. Objaśnienia są pod ręką, a po teście można wrócić do tematów, które potrzebują jeszcze chwili uwagi.

Wspólna sowa to logo i przewodniczka całego systemu. Towarzyszy uczniowi od wyboru tematu po podsumowanie wyprawy. Kumilo nie wymaga konta, nie wyświetla reklam i nie porównuje dzieci w publicznych rankingach.

## Jak wygląda nauka

1. **Wybierz swoją wyprawę.** Klasa, przedmiot i temat pochodzą z katalogu dostępnych materiałów.
2. **Ucz się przez działanie.** Odkrywaj karty, łącz pary, układaj kolejność i sprawdzaj pomysły. W nauce błąd nie odbiera żyć ani punktów; możesz próbować dalej.
3. **Zajrzyj do objaśnienia.** Rozwiń lekcję przy zadaniu albo obejrzyj cały dział i mapę myśli.
4. **Sprawdź, co pamiętasz.** W teście możesz wracać do pytań. Odpowiedzi i wyjaśnienia poznasz po zatwierdzeniu całości.
5. **Wróć do trudniejszych tropów.** Powtórka dobiera powiązane aktywności lub objaśnienia. Wynik można wydrukować albo zapisać do PDF przez przeglądarkę.

Ukończone aktywności zostają w pamięci przeglądarki. Przycisk „Kontynuuj” prowadzi do pierwszej nieukończonej aktywności, nie do częściowo rozwiązanej odpowiedzi.

### Dziewięć sposobów na odkrywanie

| Aktywność | Co robi uczeń |
| --- | --- |
| Odkrywanie kart | Odsłania przedmioty i poznaje ich znaczenie. |
| Fiszki | Zastanawia się nad pytaniem i odwraca kartę. |
| Jedna odpowiedź | Wybiera jedną z podanych możliwości. |
| Wiele odpowiedzi | Zaznacza wszystkie pasujące możliwości. |
| Łączenie par | Łączy karty z obu kolumn, zaczynając od dowolnej strony. |
| Sortowanie | Przypisuje elementy do kategorii. |
| Porządkowanie | Przeciąga elementy lub przesuwa je strzałkami. |
| Krótka odpowiedź | Wpisuje własną odpowiedź tekstową. |
| Odpowiedź liczbowa | Podaje liczbę w określonej jednostce; może używać przecinka dziesiętnego. |

### Dostępny materiał

Wersja **0.1.0** zawiera dział **„Detektywi przeszłości”** dla klasy IV z historii: siedem lekcji, dziewięć aktywności na ścieżce nauki i test z 16 pytaniami. Zakres obejmuje podstawy poznawania przeszłości, źródła historyczne, rodzinę i porządek czasu.

System obsługuje kolejne klasy, przedmioty i tematy przez wspólny format JSON. Nowe treści nie wymagają tworzenia osobnego interfejsu dla każdego działu.

## Prosta technologia, osobne treści

Kumilo działa jako statyczna strona: HTML, CSS, moduły JavaScript i pliki JSON. Nie ma backendu aplikacyjnego, bazy danych ani zależności npm. Przeglądarka pobiera zasoby z hostingu, ocenia odpowiedzi i zapisuje postęp lokalnie.

```text
data/catalog.json
        ↓ wybór klasy, przedmiotu i tematu
data/klasa-4/historia/detektywi-przeszlosci/topic.json
        ↓ lekcje, zadania, mapa myśli i testy
interfejs Kumilo → nauka → wynik → powtórka
        ↕
localStorage w przeglądarce
```

Treści edukacyjne są niezależne od kodu interfejsu. JSON opisuje znaczenie zadania, a nie wygląd przycisków. Schemat i walidator sprawdzają strukturę, identyfikatory, klucze odpowiedzi i powiązania między elementami.

## Uruchomienie

Do pracy nad projektem potrzebujesz **Node.js 22+** oraz **Pythona 3.10+**. Python służy do walidacji i testów, a nie do działania opublikowanej aplikacji. Nie trzeba uruchamiać `npm install`.

Z katalogu projektu:

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-dev.txt
npm test
npm run build
```

Aktywacja środowiska na Windows: `.venv\Scripts\Activate.ps1` w PowerShell. Jeśli interpreter nie jest dostępny pod nazwą `python3`, użyj odpowiedniego polecenia dla swojej instalacji.

### Podgląd zbudowanej aplikacji

```sh
python -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Otwórz **http://127.0.0.1:8000/**. Ten podgląd udostępnia tylko katalog wynikowy. Po zmianie źródeł ponownie wykonaj `npm run build`.

Nie otwieraj `index.html` przez dwuklik: `file://` nie zapewnia poprawnego wczytywania modułów i JSON. Do pracy bez przebudowywania można użyć podglądu HTTP z edytora. Na stanowisku autora dostępny jest też opcjonalny `local-server/serve.py`; jest prywatnym narzędziem, ignorowanym przez Git i nieobecnym w świeżym klonie.

## Struktura projektu

```text
kumilo/
├── index.html              # szkielet strony i dialogi
├── assets/                 # interfejs, mechanizmy zadań, style i ilustracje
├── data/                   # publiczne treści: klasa / przedmiot / temat
│   ├── catalog.json
│   ├── content.schema.json
│   └── klasa-4/historia/detektywi-przeszlosci/topic.json
├── scripts/                # budowanie paczki i walidacja danych
├── tests/                  # testy logiki, danych i scenariusze przeglądarkowe
├── docs/                   # obsługa, format danych i publikacja
├── .github/workflows/      # automatyczna kontrola jakości
├── package.json
├── requirements-dev.txt
└── dist/                   # generowana paczka; poza Git
```

Do repozytorium należą kod, sowa i pozostałe zasoby, autorskie treści JSON, testy, skrypty i dokumentacja. Poza nim pozostają materiały źródłowe, lokalny serwer, środowiska, cache i wyniki budowania. Szczegóły: [zasady pracy z repozytorium](CONTRIBUTING.md).

## Dodawanie materiałów

1. Przygotuj autorskie objaśnienia i zadania na podstawie zakresu nauki. Nie kopiuj zdjęć ani stron podręcznika do publicznych danych.
2. Umieść paczkę w `data/klasa-N/przedmiot/temat/topic.json` i dodaj wpis do `data/catalog.json`.
3. Zachowaj kontrakt `schemaVersion: "1.0"`, stabilne identyfikatory i powiązania z lekcjami.
4. Uruchom `npm test`, sprawdź materiał merytorycznie i przejdź go w przeglądarce.

Pełny opis pól i typów zadań znajduje się w [dokumentacji formatu danych](docs/data-format.md). Walidator nie zastępuje oceny poprawności historycznej czy dydaktycznej.

## Prywatność i granice systemu

- Postęp i ostatni wynik zostają w `localStorage` danego profilu przeglądarki. Aplikacja nie wysyła ich do backendu.
- Imię lub pseudonim z testu pozostaje tylko w pamięci bieżącej karty.
- Kumilo nie rozpoznaje osoby. Na wspólnym urządzeniu inny użytkownik tego samego profilu może zobaczyć postęp; można go usunąć przez „Dane na urządzeniu”.
- Odświeżenie nie wznawia niezatwierdzonego testu ani częściowo rozwiązanej aktywności. Nie ma synchronizacji między urządzeniami.
- Klucze odpowiedzi są publiczne w JSON. To narzędzie do samosprawdzenia, nie zabezpieczony egzamin.
- Hosting może prowadzić własne logi dostępu niezależnie od aplikacji.

## Testy i publikacja

`npm test` uruchamia testy JavaScript, testy Python i walidację rzeczywistych danych. Scenariusze w `tests/browser-checks.mjs` oraz `tests/review-regressions.mjs` wymagają osobnego uruchomienia w przeglądarce i nie są częścią tego polecenia ani obecnego CI. Obsługę dotyku trzeba też sprawdzić na fizycznym telefonie.

`npm run build` przygotowuje `dist/` z aplikacją, zasobami, danymi i plikiem `.nojekyll`. **Publikuj wyłącznie zawartość `dist/`, nigdy cały katalog roboczy.** Hosting musi obsługiwać HTTP(S) i poprawne typy MIME, w tym dla `.mjs`. Strona może działać w katalogu głównym lub podkatalogu, np. `/kumilo/`.

Workflow [check.yml](.github/workflows/check.yml) uruchamia testy i buduje artefakt `kumilo-static` po pushu do `main`, przy pull requeście lub ręcznie. Nie wdraża strony i nie tworzy wydania.

## Dokumentacja

| Dokument | Zawartość |
| --- | --- |
| [Obsługa aplikacji](docs/application.md) | Nauka, testy, powtórka i zapis postępu. |
| [Format danych](docs/data-format.md) | Kontrakt JSON i zasady tworzenia tematów. |
| [Publikacja](docs/publication.md) | Przygotowanie paczki, hosting i kontrola wdrożenia. |
| [Sowa Kumilo](docs/branding.md) | Wspólne logo i zastosowania maskotki. |
| [Praca z repozytorium](CONTRIBUTING.md) | Co wersjonować, jak sprawdzać zmiany i chronić lokalne materiały. |

## Prawa do kodu i treści

Projekt nie ma jeszcze określonej licencji. Publiczna dostępność repozytorium nie oznacza dowolnego prawa do wykorzystywania kodu, ilustracji ani treści. Zasady ich udostępniania wymagają decyzji właściciela projektu.
