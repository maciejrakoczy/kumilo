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

„Detektywi przeszłości” korzystają z wdrożonego `learningPlan`: siedem krótkich wypraw po sześć aktywności. Kolejność, pule i ustawienia pochodzą z JSON. Kontrakt i zasady opisuje [organizacja nauki według tematów](learning-organization.md).

1. Wybierz klasę, przedmiot i temat przyciskiem „Zmień”. Dostępne pozycje pochodzą wyłącznie z `data/catalog.json`.
2. Wybierz „Rozpocznij wyprawę”, aby przejść cały dział w kolejności planu JSON, bez podsumowań między lekcjami, albo „Ucz się tematami”, aby wybrać jedną lekcję. Pełna wyprawa ma własną kontynuację, niezależną od kursorów pojedynczych tematów, ale korzysta z tych samych zadań i gwiazdek. Nagłówek liczy wszystkie aktywności, a kropki wskazują kolejne tematy. Po ukończeniu wszystkich kroków można rozpocząć nową wyprawę z ponownym losowaniem, bez dodatkowych gwiazdek.
3. Rozwiązuj zadania. Błąd nie odbiera gwiazdek; po jego poprawieniu może pojawić się jeden dodatkowy przykład z tej samej puli, bez łańcucha kolejnych zadań.
4. Przy potrzebie użyj przycisku „Podpowiedź” w stopce karty i rozwiń objaśnienie lekcji. W sekcji „Lekcje i mapa myśli” dostępny jest cały zakres.
5. Po ukończeniu aktywności przejdź do kolejnej. Temat kończy się własnym podsumowaniem z sową. „Powtórka mieszana” na starcie lub w wyborze tematów pozwala ręcznie wrócić do zadań z różnych lekcji; nie ma harmonogramu powtórek.

Aktywności: odkrywanie kart, fiszki, pytania jedno- i wielokrotnego wyboru, pary w obu kierunkach, sortowanie do kategorii, układanie kolejności oraz odpowiedzi tekstowe i liczbowe. Wyprawa pojedynczego tematu prowadzi przez: Odkryj → Zapamiętaj → Rozpoznaj → Połącz → Zastosuj → Utrwal. Daje to 42 podstawowe aktywności w całym dziale, z dodatkowymi przykładami po błędach niezwiększającymi liczby gwiazdek. Pakiety bez `learningPlan` nadal używają dawnego `learningPath`.

Po odkryciu karty jej objaśnienie pojawia się wewnątrz tej karty zamiast napisu zachęcającego do odkrycia. Treść pozostaje widoczna po odkryciu kolejnych kart; nie pojawia się dodatkowy dymek pod planszą. Ponowne kliknięcie nie zwiększa postępu ani nie przyznaje kolejnej nagrody.

Ekrany nauki i testu korzystają ze wspólnej karty: kontekst i numer zadania w nagłówku strony, tytuł aktywności i punktowy postęp nad kartą, polecenie oraz instrukcja w karcie, a pod odpowiedziami stała stopka z postępem bieżącego zadania i główną akcją. W nauce podpowiedź jest rozwijana na żądanie; pytania wymagające zatwierdzenia mają w stopce „Sprawdź”, a po sukcesie „Dalej”. Test nie pokazuje podpowiedzi merytorycznych i pozwala pominąć pytanie oraz do niego wrócić.

Pary pokazują dopasowanie krzywą linią oraz takim samym numerem na obu kartach. W nauce zielone połączenie oznacza zaakceptowaną parę. W teście fioletowa linia przedstawia wybór ucznia, niezależnie od poprawności; lista wybranych połączeń nadal pozwala je odczytać i rozłączyć. Linie są dekoracyjnym SVG, nie zastępują treści dostępnej dla czytnika ekranu. Ich geometria aktualizuje się po zmianie rozmiaru kart, a obserwatory są sprzątane przy opuszczaniu zadania.

Widok karty jest w `assets/activity-view.mjs`, a jego style w `assets/activity.css`, oddzielnie od pozostałych ekranów. `mountTask` przyjmuje `controls: false` i `onStateChange`, dzięki czemu wspólna stopka może obsłużyć stan, licznik i zatwierdzenie każdego typu bez powielania przycisków w rendererze. Zwracane `check()` zatwierdza tylko odpowiednie typy w nauce; nie ocenia odpowiedzi w teście. `getState()` udostępnia postęp i gotowość do sprawdzenia, bez sugerowania poprawności niezatwierdzonych odpowiedzi testowych.

Bank „Detektywów przeszłości” zawiera 276 aktywności: 143 do nauki i osobne 133 zadania testowe. Plan obejmuje sześć aktywności na każdą z siedmiu lekcji, a dziewięć typów jest zapewnione w skali całego planu, nie pojedynczej lekcji. Test nadal wybiera 16 pytań, z co najmniej jednym każdego z siedmiu ocenianych typów. Pozostałe miejsca testu są równoważone między typami z zachowaniem kwot tematów. Wśród 42 pytań wielokrotnego wyboru występują zestawy z jedną, dwiema i trzema poprawnymi odpowiedziami oraz 3–5 opcjami. Rozkład tematów i ograniczenia opisuje [bank zadań](question-bank.md).

Każdy krok tematu ma własną pulę w `learningPlan.lessons[].steps[].taskIds`. Silnik przygotowuje wybory dla całego planu, zachowując zakres i wymagane typy; samo przygotowanie nie oznacza wyświetlenia. Historia daje pierwszeństwo niewidzianym przykładom, ale nie kosztem zakresu i różnorodności. „Przejdź temat od początku” losuje tylko ten temat, zachowując pozostałe wybory i wszystkie gwiazdki. Fiszki są teraz stałym drugim etapem każdej lekcji. Bank nadal zawiera dziewięć zestawów fiszek (21 kart) i dziewięć aktywności odkrywania kart; nie dodano ani nie usunięto zadań przy zmianie organizacji. W ostatnim kroku nie ma przycisku i panelu podpowiedzi, pozostaje informacja zwrotna po odpowiedzi.

### Gwiazdki i odznaki

Każda pierwszy raz ukończona podstawowa aktywność daje jedną gwiazdkę, przypisaną do stabilnego miejsca planu. Na starcie widać sumę odkryć, w wyborze tematów ich postęp, a w podsumowaniu tematu gwiazdki i odznaki: „Pierwszy krok”, „Na tropie” i „Odkrywca”. Dodatkowe przykłady i powtórki mieszane nie mnożą gwiazdek. Wcześniejsze osiągnięcia dziewięciu etapów pozostają osobno w „Twoich wcześniejszych odkryciach”, bez uznawania nowych tematów za ukończone. Nagrody oznaczają wykonanie aktywności, nie potwierdzają opanowania całego działu.

Odkrywane karty i fiszki reagują animacją, a ukończenie aktywności wyświetla krótką animację gwiazdek. Efekty nie blokują dalszego działania. Nagrody wynikają z istniejącego zapisu postępu: pozostają po odświeżeniu, a usunięcie danych Kumilo usuwa je razem z postępem. Przy niedostępnej pamięci przeglądarki nie są trwałe.

Animacje respektują systemowe ustawienie ograniczenia ruchu (`prefers-reduced-motion`); przy nim nagrody pozostają widoczne, ale bez ruchu i cząsteczek. W teście nie ma nagród ani efektów sygnalizujących poprawność przed zatwierdzeniem. Test bez limitu nie wyświetla żadnego tekstu o czasie.

Przy błędnej odpowiedzi w nauce sówka ma smutne oczy i opuszczone skrzydełka, krótko wzdycha i uroni łezkę. Obok pozostaje wskazówka i zachęta do kolejnej próby, bez odbierania nagród. Reakcja znika przy zmianie odpowiedzi; po poprawnym rozwiązaniu wracają efekty sukcesu. Dotyczy to pytań wyboru, par, sortowania, kolejności i odpowiedzi wpisywanych. W teście smutna sówka pojawia się dopiero w podsumowaniu zawierającym błędy. Przy ograniczeniu ruchu zostaje nieruchoma ilustracja.

Kolejność można zmieniać przeciąganiem karty myszą, uchwytem przy dotyku albo przyciskami strzałek. Escape i przerwanie ruchu anulują przeciąganie. Strzałki są alternatywą dla klawiatury i osób, którym przeciąganie sprawia trudność.

## Test

- Imię lub pseudonim jest tylko w pamięci bieżącej karty.
- Test korzysta z definicji w JSON: liczby pytań, punktów i ewentualnego limitu czasu.
- Przy `draw` aplikacja zachowuje kwoty tematów i maksymalizuje różnorodność typów. W bieżącym banku każde podejście obejmuje siedem ocenianych typów i cały wskazany zakres, bez powtórzonych pytań. Pozostałe miejsca równoważy między dostępnymi typami. Pytania spoza ostatniego zatwierdzonego testu mają pierwszeństwo, o ile nie ogranicza to pokrycia typów i tematów. Przy małych pulach dopuszczone są wcześniejsze pytania; bieżący bank pozwala uniknąć wszystkich pytań z bezpośrednio poprzedniego podejścia. Nie oznacza to, że pytanie nigdy nie wróci w dalszych testach.
- Wstęp pokazuje liczbę losowanych pytań i punktów, nie długość całego banku. Nawigacja wstecz nie losuje pytań od nowa. Ocena, objaśnienia i zapis wyniku dotyczą tylko wylosowanego zestawu.
- Możesz wracać do pytań i pomijać je do późniejszego uzupełnienia.
- Przed zatwierdzeniem lista pytań pokazuje brakujące odpowiedzi.
- Poprawne odpowiedzi i wyjaśnienia są ujawniane dopiero w podsumowaniu, nie podczas testu.
- Każde pytanie jest oceniane całościowo, zgodnie z kontraktem JSON.
- „Poćwicz moje błędy” wybiera aktywności naukowe powiązane z lekcjami z błędnych odpowiedzi. Jeśli ścieżka nauki nie obejmuje wszystkich tych lekcji, aplikacja pokazuje odpowiednie objaśnienia zamiast uruchamiać pustą aktywność.
- Utworzone pary w teście są widoczne jako jawna lista połączeń. Każdą można rozłączyć osobno i poprawić, również po powrocie do pytania. Lista nie podpowiada poprawności.
- Wynik można wydrukować lub zapisać do PDF przez okno drukowania przeglądarki.

To narzędzie edukacyjne, nie zabezpieczony system egzaminacyjny: klucz odpowiedzi znajduje się w publicznych plikach JSON.

## Postęp i prywatność

Kumilo używa własnego wpisu w localStorage. Zapisuje ukończone etapy, otwierane lekcje, wylosowane warianty nauki wraz z historią ich wyświetlania i ostatni wynik tematu. Otworzenie lekcji nie oznacza automatycznie jej opanowania. Nie zapisuje imienia ani nie wysyła wyników do serwera. Wcześniejsze gwiazdki zachowują ważność po dodaniu nowych wariantów.

Zapis dotyczy profilu przeglądarki, nie rozpoznaje osoby. Na wspólnym urządzeniu należy użyć „Dane na urządzeniu” → „Usuń zapisane dane Kumilo”. Usuwany jest tylko zapis Kumilo, nie inne dane przeglądarki.

Wyłączenie pamięci przeglądarki nie powinno blokować nauki; pojawia się informacja o braku trwałego zapisu. Niezatwierdzony test oraz częściowo rozwiązane bieżące zadanie nie są wznawiane po odświeżeniu — kontynuacja dotyczy ukończonych aktywności.

## Architektura

- `index.html` — wspólny szkielet strony i dialogi;
- `assets/app.mjs` — katalog, nawigacja, nauka, testy, powtórka;
- `assets/learning-plan.mjs` — interpretacja i walidacja planu oraz wybór zadań;
- `assets/learning-session.mjs`, `assets/learning-view.mjs` — sesje tematów, dodatkowe ćwiczenia, powtórki i ich prezentacja;
- `assets/tasks.mjs` — wspólne mechanizmy dziewięciu typów zadań;
- `assets/reorder.mjs` — przeciąganie i porządkowanie;
- `assets/core.mjs` — sprawdzanie modelu, pobieranie danych, ocenianie, zapis;
- `assets/rewards.mjs` — gwiazdki, odznaki i krótkie efekty sukcesu;
- `assets/selection.mjs` — losowanie wariantów nauki i testów z zachowaniem pokrycia tematów;
- `assets/owl.svg` — jeden wspólny logotyp i maskotka;
- `data/` — jedyne źródło treści edukacyjnych i kluczy odpowiedzi.

Szkice wyglądu zostały usunięte; jedynym interfejsem jest właściwa aplikacja.

## Sprawdzenie kodu i treści

```sh
npm test
```

Polecenie uruchamia testy Node (w tym budowanie bezpiecznej paczki), testy Python i walidację rzeczywistych danych. Wymaga Node oraz Pythona z zależnościami `requirements-dev.txt`; nie wymaga `npm install`. Prywatne testy lokalnego serwera są poza głównym zestawem: `python3 -m unittest discover -s local-server/tests -v`. Weryfikację interakcji i wyglądu w przeglądarce wykonuje się osobno. Próby zdarzeń dotykowych w przeglądarce nie zastępują sprawdzenia na fizycznym telefonie.
