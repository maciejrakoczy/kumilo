# Bank zadań „Detektywi przeszłości”

Źródło publikowanej treści: `data/klasa-4/historia/detektywi-przeszlosci/topic.json`. Łącznie 260 aktywności: 127 w banku nauki i 133 w banku testowym. Ostatnie rozszerzenie dodaje 99 autorskich zadań do wcześniejszych 161, bez usuwania identyfikatorów ani zmiany dziewięciu etapów wyprawy. Banki nie współdzielą identyfikatorów; ćwiczą te same umiejętności przez inne przykłady. Część pytań wraca do tych samych zasad — nie są to 260 niezależnych zagadnień. Dwie aktywności (odkrywanie kart i fiszki) nie są ocenianymi pytaniami.

## Pokrycie

| Zakres | Bank nauki | Bank testów | Pytań w jednym teście |
| --- | ---: | ---: | ---: |
| Praca historyka, fakt i domysł | 20 | 15 | 2 |
| Źródła i archeologia | 17 | 22 | 3 |
| Historia rodziny | 17 | 18 | 2 |
| Chronologia i jednostki czasu | 20 | 18 | 2 |
| Epoki i umowność granic | 17 | 18 | 2 |
| Liczby rzymskie i wieki | 18 | 22 | 3 |
| Odstęp między oznaczeniami lat | 18 | 20 | 2 |
| Razem | 127 | 133 | 16 |

## Różnorodność aktywności

| Format | Liczba |
| --- | ---: |
| Jednokrotny wybór | 78 |
| Wielokrotny wybór | 42 |
| Pary | 33 |
| Sortowanie | 28 |
| Kolejność | 23 |
| Krótka odpowiedź | 18 |
| Odpowiedź liczbowa | 36 |
| Odkrywanie kart | 1 |
| Fiszki | 1 |
| Razem | 260 |

Wielokrotny wybór nie oznacza z góry dwóch zaznaczeń: 12 zadań ma jedną poprawną odpowiedź, 18 ma dwie, a 12 ma trzy. Pytania mają 3–5 opcji i zawsze przynajmniej jedną błędną. Zarówno bank nauki, jak i testów zawiera wszystkie trzy liczby poprawnych zaznaczeń i wszystkie trzy liczby opcji. Każda z siedmiu lekcji ma pytania wielokrotnego wyboru w obu bankach. Nie ujawniamy oczekiwanej liczby zaznaczeń w poleceniu.

Rozszerzenie nie dodaje pytań jednokrotnego wyboru ani kolejnych samotnych obliczeń liczbowych. Stawia na klasyfikowanie, łączenie informacji z dowodami, odróżnianie faktów od domysłów, odczytywanie fikcyjnych relacji rodzinnych, porządkowanie i wyjaśnianie zasad. Te same umiejętności pojawiają się w różnych formatach zamiast wyłącznie w seriach zmienionych dat.

## Losowanie

`tests[].questions` zawiera wszystkich kandydatów. `draw` deklaruje kwoty lekcji z tabeli, dzięki czemu test nie pomija żadnego zakresu. W jednym podejściu nie ma dwóch takich samych identyfikatorów. Pytania niewystępujące w ostatnim zatwierdzonym wyniku mają pierwszeństwo; bieżące pule pozwalają wybrać cały kolejny zestaw bez pokrywania się z poprzednim. Po kilku podejściach pytania mogą wracać. Nie deklarujemy niepowtarzalności w nieskończoność. Przy mniejszych bankach silnik uzupełnia brakujące miejsca wcześniej widzianymi pytaniami, nie skraca testu.

Pytania i opcje wyboru są tasowane. Po kliknięciu odpowiedzi opcje nie zmieniają miejsca. W zadaniu kolejności startowy układ jest tasowany i nie jest gotową poprawną odpowiedzią. Powrót w teście zachowuje odpowiedź i wylosowane pytanie. Wynik i objaśnienia dotyczą wyłącznie wybranych 16 pytań, nie wszystkich 133 kandydatów.

`learningPath` określa dziewięć stałych etapów, a `learningVariants` ich alternatywne aktywności. Każdy wariant dotyczy tych samych lekcji co etap. W kolejnym przejściu pierwszeństwo mają warianty jeszcze niewyświetlone w danym obiegu puli. Dopiero wyświetlenie aktywności oznacza ją jako widzianą — nie samo przygotowanie dalszej części wyprawy. Po wyczerpaniu puli zaczyna się nowy obieg, bez bezpośredniego powtórzenia ostatniego wariantu. Kontynuacja zachowuje rozpoczęty wariant, ale nie niezatwierdzone odpowiedzi. Gwiazdki przypisane są do etapów, nie do wariantów, więc wcześniejszy postęp nie przepada i nie można mnożyć nagród przez powtarzanie.

## Umiejętności i powtórka

| Lekcja | Cel sprawdzany w nauce i teście | Sposoby ćwiczenia |
| --- | --- | --- |
| `praca-historyka` | Oddzielić ustalenie od domysłu i dobrać dowód do pytania | Ocena wniosków, sortowanie informacji, pary pytań i dowodów |
| `zrodla-historyczne` | Rozpoznać rodzaj źródła i informacje, które może przekazać | Grupowanie śladów, dopasowania, wybór uzasadnionych informacji |
| `historia-rodziny` | Odczytać relacje i rozpoznać sposoby poznawania historii rodziny | Fikcyjne rodziny, pamiątki i tradycje, krótkie odpowiedzi |
| `chronologia` | Uporządkować daty obu er i rozumieć jednostki czasu | Kolejność, grupowanie, rozpoznawanie błędnych reguł |
| `epoki` | Rozumieć kolejność epok i umowność ich granic | Pary, porządkowanie i klasyfikowanie opisów |
| `wieki-i-liczby-rzymskie` | Czytać zapis rzymski i przypisywać lata do wieków | Dopasowania zapisów i przedziałów, grupowanie, poprawianie pomyłek |
| `uplyw-lat` | Dobrać sposób obliczania odstępu, uwzględniając brak roku zerowego | Dobór reguły do dat, ocena obliczeń, porównywanie odstępów |

Obie pule mają odrębne zadania powiązane z tymi samymi `lessonIds`. Dzięki temu błąd testowy kieruje do odpowiedniej lekcji i jej wariantów nauki przez istniejącą funkcję „Poćwicz moje błędy”, bez ponownego podawania identycznego pytania testowego.

## Zasady opracowania treści

- Zakres pochodzi z istniejących siedmiu lekcji; nie dopisano nowego działu ani nowych wymaganych wydarzeń.
- Zadania nie są kopią materiałów źródłowych. Nowe scenariusze obejmują inne znaleziska, pytania badawcze, rodziny i daty rachunkowe.
- Rodziny i sytuacje badawcze są wyraźnie fikcyjne. Dziecko nie musi podawać danych o własnych krewnych.
- Źródła klasyfikujemy według konwencji opisanej w lekcji. Przy ustnej relacji odróżniamy przekaz od nośnika; unikamy niejednoznacznego klasyfikowania monet czy fotografii.
- Granice epok 476, 1492 i 1918 przedstawiamy jako konwencję działu, nie jedyny uniwersalny podział ani nagłą zmianę życia wszystkich ludzi.
- Rachunkowe daty nie udają dat historycznych wydarzeń. Odstęp między oznaczeniami lat nie jest dokładnym wiekiem człowieka liczonym według dni i miesięcy.
- Wiek ma sto lat, lata kończące się na 00 zamykają wiek; przy przejściu między erami nie doliczamy nieistniejącego roku zerowego.
- Klucze zawierają objaśnienia. Krótkie odpowiedzi uwzględniają potrzebne formy fleksyjne; nadal nie są oceniane przez dowolne podobieństwo tekstu.

## Sprawdzenie

`npm run test` obejmuje kontrakt i semantykę banków, rozłączność nauki i testu, widoczną odróżnialność opcji i par, niezależne sprawdzanie rachunków, 500 losowań testu i osiągalność wariantów nauki. Test jakości pilnuje minimalnej liczebności i liczby formatów w każdej lekcji oraz zmiennych rozmiarów klucza w obu bankach. Dla każdego pytania wielokrotnego wyboru sprawdzane są wszystkie podzbiory odpowiedzi po różnych przetasowaniach — punktowany jest wyłącznie pełny poprawny zbiór. Nie jest to zastępstwo recenzji pedagogicznej.

`tests/bank-browser.mjs` montuje i rozwiązuje każde zadanie, sprawdza dwa prawdziwe podejścia do testu, pokrycie tematów, zapis tylko wylosowanego wyniku, kontynuację nauki i zachowanie gwiazdek po powtórce. `tests/browser-checks.mjs` nadal obejmuje pełną wyprawę, ocenianie, cofanie, powtórki, klawiaturę, przeciąganie i usuwanie własnych danych. Scenariusze można uruchomić na kodzie źródłowym i na paczce z modułami `.js`.
