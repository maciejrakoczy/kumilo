# Pierwsza działająca wersja Kumilo

## Uruchomienie

Podgląd dostępny również w świeżym klonie repozytorium, z katalogu projektu:

```sh
npm run build
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Otwórz http://127.0.0.1:8000/. Po zmianie źródeł ponów budowanie. W poleceniu serwera możesz zastąpić `8000` innym portem. Wymagania i przygotowanie narzędzi opisuje [README](../README.md#uruchomienie).

Interfejs jest statyczny: HTML, CSS, moduły JavaScript i lokalne JSON. Opcjonalny serwer Pythona znajduje się w ignorowanym przez Git katalogu `local-server/` i nie jest częścią projektu do publikacji ani świeżego klonu repozytorium. Nie ma backendu aplikacyjnego, kont ani bazy danych. Stronę można uruchomić na dowolnym poprawnie skonfigurowanym hostingu statycznym. Nie otwieraj jej przez `file://`, ponieważ przeglądarka blokuje wtedy wczytywanie JSON i modułów.

Powyższe polecenie udostępnia wyłącznie `dist/`. Jeśli na stanowisku masz prywatny serwer, możesz zamiast tego użyć `python3 local-server/serve.py` (zmiana portu: `--port 8001`), aby oglądać źródła bez przebudowywania. Ten serwer udostępnia tylko stronę startową, `assets/` i `data/`, bez `materiały/`, `.git/`, testów i dokumentacji. Publikuj wyłącznie zawartość `dist/`, nigdy cały katalog roboczy. Instrukcja: [publikacja](publication.md).

## Nauka

1. Wybierz klasę, przedmiot i temat przyciskiem „Zmień”. Dostępne pozycje pochodzą wyłącznie z `data/catalog.json`.
2. Uruchom wyprawę. Przycisk „Kontynuuj” prowadzi do pierwszej nieukończonej aktywności.
3. Rozwiązuj zadania. Błąd nie odbiera żyć ani punktów z nauki; można próbować dalej.
4. Przy potrzebie rozwiń objaśnienie lekcji pod zadaniem. W sekcji „Lekcje i mapa myśli” dostępny jest cały zakres.
5. Po ukończeniu aktywności przejdź do kolejnej. Przejście całej ścieżki kończy się podsumowaniem z sową.

Aktywności: odkrywanie kart, fiszki, pytania jedno- i wielokrotnego wyboru, pary w obu kierunkach, sortowanie do kategorii, układanie kolejności oraz odpowiedzi tekstowe i liczbowe. W pierwszej ścieżce nauki jest dziewięć aktywności; pełny dział obejmuje siedem lekcji.

Kolejność można zmieniać przeciąganiem karty myszą, uchwytem przy dotyku albo przyciskami strzałek. Escape i przerwanie ruchu anulują przeciąganie. Strzałki są alternatywą dla klawiatury i osób, którym przeciąganie sprawia trudność.

## Test

- Imię lub pseudonim jest tylko w pamięci bieżącej karty.
- Test korzysta z definicji w JSON: liczby pytań, punktów i ewentualnego limitu czasu.
- Możesz wracać do pytań i pomijać je do późniejszego uzupełnienia.
- Przed zatwierdzeniem lista pytań pokazuje brakujące odpowiedzi.
- Poprawne odpowiedzi i wyjaśnienia są ujawniane dopiero w podsumowaniu, nie podczas testu.
- Każde pytanie jest oceniane całościowo, zgodnie z kontraktem JSON.
- „Poćwicz moje błędy” wybiera aktywności naukowe powiązane z lekcjami z błędnych odpowiedzi. Jeśli ścieżka nauki nie obejmuje wszystkich tych lekcji, aplikacja pokazuje odpowiednie objaśnienia zamiast uruchamiać pustą aktywność.
- Utworzone pary w teście są widoczne jako jawna lista połączeń. Każdą można rozłączyć osobno i poprawić, również po powrocie do pytania. Lista nie podpowiada poprawności.
- Wynik można wydrukować lub zapisać do PDF przez okno drukowania przeglądarki.

To narzędzie edukacyjne, nie zabezpieczony system egzaminacyjny: klucz odpowiedzi znajduje się w publicznych plikach JSON.

## Postęp i prywatność

Kumilo używa własnego wpisu w localStorage. Zapisuje ukończone aktywności, otwierane lekcje i ostatni wynik tematu. Otworzenie lekcji nie oznacza automatycznie jej opanowania. Nie zapisuje imienia ani nie wysyła wyników do serwera.

Zapis dotyczy profilu przeglądarki, nie rozpoznaje osoby. Na wspólnym urządzeniu należy użyć „Dane na urządzeniu” → „Usuń zapisane dane Kumilo”. Usuwany jest tylko zapis Kumilo, nie inne dane przeglądarki.

Wyłączenie pamięci przeglądarki nie powinno blokować nauki; pojawia się informacja o braku trwałego zapisu. Niezatwierdzony test oraz częściowo rozwiązane bieżące zadanie nie są wznawiane po odświeżeniu — kontynuacja dotyczy ukończonych aktywności.

## Architektura

- `index.html` — wspólny szkielet strony i dialogi;
- `assets/app.mjs` — katalog, nawigacja, nauka, testy, powtórka;
- `assets/tasks.mjs` — wspólne mechanizmy dziewięciu typów zadań;
- `assets/reorder.mjs` — przeciąganie i porządkowanie;
- `assets/core.mjs` — sprawdzanie modelu, pobieranie danych, ocenianie, zapis;
- `assets/owl.svg` — jeden wspólny logotyp i maskotka;
- `data/` — jedyne źródło treści edukacyjnych i kluczy odpowiedzi.

Szkice wyglądu zostały usunięte; jedynym interfejsem jest właściwa aplikacja.

## Sprawdzenie kodu i treści

```sh
npm test
```

Polecenie uruchamia testy Node (w tym budowanie bezpiecznej paczki), testy Python i walidację rzeczywistych danych. Wymaga Node oraz Pythona z zależnościami `requirements-dev.txt`; nie wymaga `npm install`. Prywatne testy lokalnego serwera są poza głównym zestawem: `python3 -m unittest discover -s local-server/tests -v`. Weryfikację interakcji i wyglądu w przeglądarce wykonuje się osobno. Próby zdarzeń dotykowych w przeglądarce nie zastępują sprawdzenia na fizycznym telefonie.
