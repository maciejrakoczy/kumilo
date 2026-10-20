# Bank zadań „Detektywi przeszłości”

Źródło publikowanej treści: `data/klasa-4/historia/detektywi-przeszlosci/topic.json`. Łącznie 161 zadań: 77 w banku nauki i 84 w banku testowym. Zachowano wcześniejsze identyfikatory oraz dziewięć etapów wyprawy, dodając 136 zadań. Banki nie współdzielą identyfikatorów; ćwiczą te same umiejętności przez inne przykłady. Część pytań siłą rzeczy wraca do tych samych zasad — nie są to 161 niezależnych zagadnień.

## Pokrycie

| Zakres | Bank nauki | Bank testów | Pytań w jednym teście |
| --- | ---: | ---: | ---: |
| Praca historyka, fakt i domysł | 9 | 10 | 2 |
| Źródła i archeologia | 11 | 11 | 3 |
| Historia rodziny | 9 | 9 | 2 |
| Chronologia i jednostki czasu | 13 | 14 | 2 |
| Epoki i umowność granic | 9 | 10 | 2 |
| Liczby rzymskie i wieki | 13 | 16 | 3 |
| Odstęp między oznaczeniami lat | 13 | 14 | 2 |
| Razem | 77 | 84 | 16 |

## Losowanie

`tests[].questions` zawiera wszystkich kandydatów. `draw` deklaruje kwoty lekcji z tabeli, dzięki czemu test nie pomija żadnego zakresu. W jednym podejściu nie ma dwóch takich samych identyfikatorów. Pytania niewystępujące w ostatnim zatwierdzonym wyniku mają pierwszeństwo; bieżące pule pozwalają wybrać cały kolejny zestaw bez pokrywania się z poprzednim. Po kilku podejściach pytania mogą wracać. Nie deklarujemy niepowtarzalności w nieskończoność. Przy mniejszych bankach silnik uzupełnia brakujące miejsca wcześniej widzianymi pytaniami, nie skraca testu.

Pytania i opcje wyboru są tasowane. Po kliknięciu odpowiedzi opcje nie zmieniają miejsca. W zadaniu kolejności startowy układ jest tasowany i nie jest gotową poprawną odpowiedzią. Powrót w teście zachowuje odpowiedź i wylosowane pytanie. Wynik i objaśnienia dotyczą wyłącznie wybranych 16 pytań, nie wszystkich 84 kandydatów.

`learningPath` określa dziewięć stałych etapów, a `learningVariants` ich alternatywne aktywności. Każdy wariant dotyczy tych samych lekcji co etap. W kolejnym przejściu pierwszeństwo mają warianty jeszcze niewyświetlone w danym obiegu puli. Dopiero wyświetlenie aktywności oznacza ją jako widzianą — nie samo przygotowanie dalszej części wyprawy. Po wyczerpaniu puli zaczyna się nowy obieg, bez bezpośredniego powtórzenia ostatniego wariantu. Kontynuacja zachowuje rozpoczęty wariant, ale nie niezatwierdzone odpowiedzi. Gwiazdki przypisane są do etapów, nie do wariantów, więc wcześniejszy postęp nie przepada i nie można mnożyć nagród przez powtarzanie.

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

`npm run test` obejmuje kontrakt i semantykę banków, rozłączność nauki i testu, widoczną odróżnialność opcji i par, niezależne sprawdzanie rachunków, 500 losowań testu i osiągalność wariantów nauki. Nie jest to zastępstwo recenzji pedagogicznej.

`tests/bank-browser.mjs` montuje i rozwiązuje każde zadanie, sprawdza dwa prawdziwe podejścia do testu, pokrycie tematów, zapis tylko wylosowanego wyniku, kontynuację nauki i zachowanie gwiazdek po powtórce. `tests/browser-checks.mjs` nadal obejmuje pełną wyprawę, ocenianie, cofanie, powtórki, klawiaturę, przeciąganie i usuwanie własnych danych. Scenariusze można uruchomić na kodzie źródłowym i na paczce z modułami `.js`.
