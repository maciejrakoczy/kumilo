# Bank zadań „Detektywi przeszłości”

Źródło publikowanej treści: `data/klasa-4/historia/detektywi-przeszlosci/topic.json`. Łącznie 276 aktywności: 143 w banku nauki i 133 w banku testowym. `learningPlan` organizuje naukę w siedem wypraw po sześć aktywności, wykorzystując istniejące zadania bez zmiany ich ID. Dawne dziewięć etapów pozostaje dla zgodności i wcześniejszych osiągnięć. Banki nie współdzielą identyfikatorów; ćwiczą te same umiejętności przez inne przykłady. Część pytań wraca do tych samych zasad — nie są to 276 niezależnych zagadnień. Dziewięć zestawów fiszek (21 kart) i dziewięć aktywności odkrywania kart nie podlegają ocenie testowej. Oba formaty obejmują wszystkie siedem lekcji.

## Pokrycie

| Zakres | Bank nauki | Bank testów | Pytań w jednym teście |
| --- | ---: | ---: | ---: |
| Praca historyka, fakt i domysł | 23 | 15 | 2 |
| Źródła i archeologia | 20 | 22 | 3 |
| Historia rodziny | 19 | 18 | 2 |
| Chronologia i jednostki czasu | 22 | 18 | 2 |
| Epoki i umowność granic | 19 | 18 | 2 |
| Liczby rzymskie i wieki | 20 | 22 | 3 |
| Odstęp między oznaczeniami lat | 20 | 20 | 2 |
| Razem | 143 | 133 | 16 |

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
| Odkrywanie kart | 9 |
| Fiszki | 9 |
| Razem | 276 |

Wielokrotny wybór nie oznacza z góry dwóch zaznaczeń: 12 zadań ma jedną poprawną odpowiedź, 18 ma dwie, a 12 ma trzy. Pytania mają 3–5 opcji i zawsze przynajmniej jedną błędną. Zarówno bank nauki, jak i testów zawiera wszystkie trzy liczby poprawnych zaznaczeń i wszystkie trzy liczby opcji. Każda z siedmiu lekcji ma pytania wielokrotnego wyboru w obu bankach. Nie ujawniamy oczekiwanej liczby zaznaczeń w poleceniu.

Rozszerzenie nie dodaje pytań jednokrotnego wyboru ani kolejnych samotnych obliczeń liczbowych. Stawia na klasyfikowanie, łączenie informacji z dowodami, odróżnianie faktów od domysłów, odczytywanie fikcyjnych relacji rodzinnych, porządkowanie i wyjaśnianie zasad. Te same umiejętności pojawiają się w różnych formatach zamiast wyłącznie w seriach zmienionych dat.

## Losowanie

`tests[].questions` zawiera wszystkich kandydatów. `draw` deklaruje kwoty lekcji z tabeli, dzięki czemu test nie pomija żadnego zakresu. Najpierw przydzielane są różne typy do miejsc zgodnych z kwotami: każde podejście obejmuje co najmniej jedno pytanie każdego z siedmiu ocenianych typów. Pozostałe miejsca są równoważone między typami w ramach dostępnych kandydatów, bez sztywnej proporcji. W jednym podejściu nie ma dwóch takich samych identyfikatorów. Pytania niewystępujące w ostatnim zatwierdzonym wyniku mają pierwszeństwo, jeśli nie ogranicza to pokrycia typów i tematów; bieżące pule pozwalają wybrać cały kolejny zestaw bez pokrywania się z poprzednim. Po kilku podejściach pytania mogą wracać. Przy mniejszych bankach silnik dopuszcza wcześniej widziane pytania zamiast ograniczać różnorodność lub skracać test.

Pytania i opcje wyboru są tasowane. Po kliknięciu odpowiedzi opcje nie zmieniają miejsca. W zadaniu kolejności startowy układ jest tasowany i nie jest gotową poprawną odpowiedzią. Powrót w teście zachowuje odpowiedź i wylosowane pytanie. Wynik i objaśnienia dotyczą wyłącznie wybranych 16 pytań, nie wszystkich 133 kandydatów.

`learningPlan` definiuje kolejność i pule sześciu kroków każdej lekcji: Odkryj, Zapamiętaj, Rozpoznaj, Połącz, Zastosuj, Utrwal. Wszystkie 143 aktywności nauki są przypisane do rozłącznych pul. „Zastosuj” ćwiczy umiejętność właściwą tematowi, a „Utrwal” używa odrębnych przykładów bez panelu podpowiedzi przed odpowiedzią. Każda lekcja ma etap fiszek i odkrywania kart. Pokrycie dziewięciu typów jest gwarancją całego planu 42 aktywności, nie każdej lekcji. Przygotowanie wyborów nie oznacza ich jako wyświetlonych. Kontynuacja zachowuje wariant i postęp, a powtórne przejście losuje tylko wybrany temat; gwiazdki dotyczą stabilnych miejsc, nie wariantów. Wcześniejsze gwiazdki dziewięciu etapów są zachowane osobno, bez automatycznego zaliczenia nowych tematów.

Po poprawieniu błędu może pojawić się jeden dodatkowy, wolny przykład z tej samej puli — bez gwiazdki i bez dalszego łańcucha ćwiczeń. Powtórka mieszana domyślnie wybiera do siedmiu ocenianych aktywności, preferując różne tematy; „Poćwicz moje błędy” zawęża zakres do odpowiednich lekcji. Nie używa banku sprawdzianu i nie jest harmonogramem. Zasady nadpisywania liczby, kolejności, pul i opcji w JSON opisuje [organizacja nauki](learning-organization.md).

Paczki bez `learningPlan` zachowują dotychczasowy przebieg: `learningPath` i `learningVariants`, maksymalna różnorodność typów, kontynuacja bez ponownego losowania oraz gwiazdki przypisane do kotwic. Te pola nadal definiują bank nauki.

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
