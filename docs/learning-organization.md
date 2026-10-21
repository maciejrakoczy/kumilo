# Organizacja nauki według tematów

## Status i zakres

Organizacja jest wdrożona przez opcjonalne `learningPlan` w `topic.json`. Każdy z siedmiu tematów „Detektywów przeszłości” ma własną wyprawę po sześć aktywności — łącznie 42 podstawowe odkrycia. W danych tematy te odpowiadają wpisom `lessons`, nie osobnym paczkom `topic.json`. Paczki bez `learningPlan` nadal korzystają z dotychczasowego `learningPath`.

Sześć aktywności na temat jest punktem wyjścia do oceny w praktyce, nie potwierdzoną uniwersalną normą. Liczba i dobór aktywności powinny dać się zmieniać w danych dla danego tematu.

## Przebieg pojedynczego tematu

Zasada: **poznaj → przećwicz → przypomnij sobie**.

| Krok | Etap | Forma | Cel |
| --- | --- | --- | --- |
| 1 | Odkryj | Odkrywanie kart | Poznanie pojęcia na konkretnych przykładach. |
| 2 | Zapamiętaj | Zestaw 2–3 fiszek | Próba przywołania podstawowej zasady przed odwróceniem karty. |
| 3 | Rozpoznaj | Jedno- lub wielokrotny wybór | Odróżnienie poprawnego przykładu od błędnego. |
| 4 | Połącz | Pary albo sortowanie | Zrozumienie zależności i kategorii. |
| 5 | Zastosuj | Forma dopasowana do umiejętności | Samodzielne użycie wiedzy. |
| 6 | Utrwal | Inny przykład, mniej podpowiedzi | Ponowne przywołanie wiedzy, nie odtworzenie identycznej odpowiedzi. |

Jeden zestaw fiszek jest jedną aktywnością; poszczególne karty nie są osobnymi krokami wyprawy. Tytuły etapów opisują cel dydaktyczny, nie nowe typy renderera.

## Dopasowanie do treści

| Temat / ID lekcji | Przykładowy cel kroku „Zastosuj” |
| --- | --- |
| Praca historyka / `praca-historyka` | Ocena dowodu lub odróżnienie faktu od domysłu. |
| Źródła / `zrodla-historyczne` | Klasyfikowanie źródła i określenie, czego można się z niego dowiedzieć. |
| Rodzina / `historia-rodziny` | Odczytanie relacji z opisu lub drzewa genealogicznego. |
| Chronologia / `chronologia` | Uporządkowanie dat, także na granicy er. |
| Epoki / `epoki` | Kolejność epok i rozpoznawanie umownych granic. |
| Liczby rzymskie i wieki / `wieki-i-liczby-rzymskie` | Odczyt zapisu lub ustalenie wieku daty. |
| Upływ lat / `uplyw-lat` | Obliczenie odstępu po dobraniu właściwej reguły. |

Nie wymuszamy wszystkich dziewięciu typów w każdym temacie. Format odpowiada umiejętności: odpowiedź liczbowa nie występuje przy pracy historyka. Silnik przygotowuje wybór dla całego planu i zapewnia zadeklarowane `requiredTypes` w skali pełnych 42 aktywności. Kontynuacja nie losuje ich ponownie. Powtórne przejście jednego tematu zachowuje wybory pozostałych tematów i uwzględnia ich typy. Krótka powtórka maksymalizuje wykonalną różnorodność we własnym zakresie, nie gwarantuje wszystkich dziewięciu typów.

## Organizacja pracy ucznia

- Jeden temat stanowi osobną, krótką wyprawę.
- Uczeń może kontynuować od ostatniego ukończonego kroku; samo obejrzenie treści nie oznacza jej opanowania.
- Po poprawieniu błędu silnik dokłada najwyżej jeden inny przykład z tej samej puli kroku. Nie wybiera zadania już przypisanego do innego miejsca tej wyprawy ani dodatkowego przykładu już użytego w niej. Jeśli nie ma wolnego kandydata, nie wymyśla zadania i nie uruchamia pętli. Błąd w dodatkowym przykładzie nie tworzy następnego. `extraPractice: 0` wyłącza dokładanie, `1` je włącza. Nowy przebieg tematu czyści jego wcześniejsze dodatkowe przykłady, nie gwiazdki.
- „Powtórka mieszana” jest uruchamiana ręcznie na starcie lub w wyborze tematów. Domyślnie wybiera do siedmiu aktywności ocenianych, po jednej z różnych tematów, zanim dobierze kolejne. Nie zawiera fiszek ani odkrywania kart. „Poćwicz moje błędy” ogranicza ten wybór do lekcji z błędnych odpowiedzi testowych. Nie ma harmonogramu ani automatycznych terminów powtórek; rozpoczęta powtórka mieszana nie jest zapisywana jako osobna sesja do wznowienia.
- Treści, wyjaśnienia i warianty pozostają autorskimi danymi JSON. Nauka i oceniany sprawdzian zachowują odrębne banki.
- Wcześniejsze gwiazdki i odznaki dziewięciu etapów pozostają w sekcji „Twoje wcześniejsze odkrycia”. Nie są przeliczane na ukończenie nowych tematów. Nowa wyprawa daje jedną gwiazdkę za każde podstawowe miejsce planu; kolejne warianty, dodatkowe przykłady i powtórki mieszane nie dają dodatkowych gwiazdek.

## Organizacja sterowana przez JSON — kontrakt

Układ nauki jest deklaracją w danych interpretowaną przez `assets/learning-plan.mjs`. `assets/learning-session.mjs` obsługuje przebieg, dodatkowe ćwiczenia i powtórki, a `assets/learning-view.mjs` prezentuje wybór tematów. Nie kopiujemy treści zadań ani nazw tematów do JavaScript.

`learningPlan` zawiera wyłącznie następujące pola:

- `defaults`: wymagane `extraPractice` (`0` lub `1`), dodatnie całkowite `reviewCount` i logiczne `avoidImmediateRepeat`.
- `requiredTypes`: unikalna lista znanych typów wymaganych w pełnym planie; może być pusta.
- `steps`: katalog wspólnych szablonów `{id, title, types, count, hints}`. `count` jest dodatnią liczbą całkowitą, `hints` wartością logiczną, a `types` niepustą listą różnych typów.
- `lessons`: uporządkowana lista `{lessonId, steps, extraPractice?}`. Każda lekcja z `topic.lessons` występuje dokładnie raz. Lista `steps` lekcji wyznacza kolejność, niezależnie od kolejności szablonów.
- Wpis kroku lekcji ma `{id, taskIds}` i może nadpisać `title`, `types`, `count`, `hints` szablonu o tym samym `id`. Lekcja może także nadpisać `extraPractice`.

Pula zawiera istniejące ID banku nauki (`learningPath` i `learningVariants`), nigdy pytania sprawdzianu. Każdy kandydat musi obejmować daną lekcję i mieć typ zgodny z efektywnym `types`. Pule różnych kroków są rozłączne, a pula musi mieścić przynajmniej `count` różnych zadań. Dla dodatkowego przykładu potrzebny jest dalszy wolny kandydat. Nie wystarczy sam typ pytania: autor dobiera treść do celu dydaktycznego etapu.

Przykład zastąpienia kroku „Utrwal” w pierwszej lekcji, bez zmiany kodu aplikacji:

```json
{"id": "utrwal", "count": 2, "hints": false, "taskIds": ["p-historyk-06", "u-historyk-14", "u-historyk-16"]}
```

`hints: false` usuwa przycisk i panel podpowiedzi przed odpowiedzią. Nie usuwa informacji zwrotnej po błędzie ani objaśnienia poprawnej odpowiedzi. W obecnym banku dotyczy ostatniego kroku każdej lekcji.

Miejsce aktywności ma stabilny identyfikator `lessonId-stepId-N`, gdzie `N` liczymy od 1. Gwiazdki i kontynuacja odnoszą się do tych miejsc, nie do wylosowanych zadań. Zwiększenie `count` dodaje kolejne miejsca, przestawienie kroków nie zmienia ich ID. Nie zmieniaj ID przy niezmienionym znaczeniu kroku.

Postęp przechowuje `learning.completedSlotIds`, `selected`, historię rzeczywistych wyświetleń `seen`, aktywny temat `activeLessonId`, jego następne miejsce `lastSlotId`, kursory odłożonych tematów `cursors` i `extraPractice` z `{taskId, done}`. Przejście do innego tematu nie gubi przerwanej powtórnej wyprawy. Nie zapisujemy częściowej odpowiedzi. Wczytywanie odrzuca nieaktualne referencje, duplikaty wyborów i kursory innego tematu; brakujące wybory są uzupełniane bez zmiany zachowanych.

Dobór zapewnia najpierw wykonalne pokrycie typów i unikalność pytań, następnie różnorodność, unikanie bezpośredniego powtórzenia (gdy włączone), a potem pierwszeństwo niewidzianych zadań. Gdy musi wrócić znane zadanie, historia innych typów pozostaje zachowana. Samo przygotowanie wyborów całego planu nie oznacza ich jako obejrzanych.

Także powtórne losowanie jednego tematu musi zachować wymagane typy całego planu, uwzględniając wybory pozostałych tematów. Przy zwiększeniu `count` uzupełnianie miejsc rezerwuje również zapisane dodatkowe przykłady; nie może podać ich drugi raz jako nowego zadania podstawowego. Jeśli krok łączy typy oceniane i nieoceniane, powtórka mieszana wybiera tylko ocenianych kandydatów i nie przekracza ich liczby — nie pomija całej mieszanej puli.

Dzięki temu zmiana kolejności, liczby kroków, dopuszczonych typów, pul kandydatów oraz dodanie kolejnego tematu będą zmianami danych, a nie kodu aplikacji.

### Granice konfiguracji

Schemat JSON, walidatory Python i JavaScript, losowanie, nawigacja i zapis postępu obsługują ten model. Nieznane pola, niewykonalne `requiredTypes`, błędne referencje, nakładające się pule i zbyt małe pule są błędami, a nie powodem do pominięcia kroków.

Później zmiany w ramach obsługiwanych opcji będą wymagać jedynie edycji JSON i weryfikacji danych. Nowy typ interakcji, nowy sposób oceniania lub nieobsługiwana reguła adaptacyjna nadal będą wymagały zmiany silnika. JSON pozostaje danymi — bez wykonywalnego JavaScript i dowolnych skryptów.

### Weryfikacja zmian

- Po zmianach: `npm test` i `npm run build`.
- Testy `learning-plan*.test.mjs`, `learning-session.test.mjs` i `test_learning_plan.py` obejmują kontrakt, różne długości i nadpisania, historię, unikalność, zachowanie starego postępu oraz rzeczywisty bank.
- `tests/learning-plan-browser.mjs` obejmuje wybór tematu, kontynuację, dodatkowe ćwiczenie, brak mnożenia gwiazdek, starą półkę nagród oraz zmianę kolejności, liczby, tytułów i podpowiedzi wyłącznie przez konfigurację testową. Uruchamia go także `tests/bank-browser.mjs`.
- Zmiany UI sprawdzaj również na wąskim ekranie i klawiaturą; testy Node/Python nie zastępują przeglądarki.

## Powiązana dokumentacja

- [Obecne działanie aplikacji](application.md).
- [Obecny format danych](data-format.md).
- [Bank pytań i zasady opracowania treści](question-bank.md).
