# Format danych edukacyjnych Kumilo 1.0

## Cel i stan

JSON jest kontraktem wymiany treści niezależnym od ekranu, przedmiotu i klasy. Nie zapisujemy w nim HTML, funkcji JavaScript, klas CSS, stanu przeciągania ani danych uczniów. Jest to pierwsza wersja kontraktu, oparta na autorskim opracowaniu działu historii. Poprawność techniczna nie zastępuje przeglądu merytorycznego.

Właściwa aplikacja `index.html` wczytuje katalog i paczki JSON oraz obsługuje dziewięć zdefiniowanych typów zadań. Treści do publikacji pochodzą wyłącznie z `data/`; szkice wyglądu zostały usunięte.

## Struktura katalogów

```text
data/
  content.schema.json
  catalog.json
  klasa-4/
    historia/
      detektywi-przeszlosci/
        topic.json
```

Jeden `topic.json` stanowi kompletną paczkę tematu/działu: lekcje, zadania, ścieżkę nauki, mapę myśli i definicje testów. Mniej plików i brak konieczności pobierania osobnego pliku dla każdego pytania. Kolejne tematy otrzymują własne katalogi. Nie tworzymy pustych tematów udających gotową zawartość.

Nazwy katalogów i identyfikatory: małe litery ASCII, cyfry i pojedyncze myślniki. Nazwy wyświetlane: pełny polski tekst, np. `Klasa IV`, `Źródła historyczne`. Numer klasy jest liczbą, a nie rzymskim napisem.

## Katalog dostępnych materiałów

Przeglądarka nie odczyta sama listy folderów na hostingu statycznym. `catalog.json` jest jawnym spisem:

- `schemaVersion`: wersja kontraktu, obecnie `1.0`;
- `kind`: `catalog`;
- `classes[]`: `id`, `grade`, `title`, `subjects[]`;
- przedmiot: `id`, `title`, `topics[]`;
- temat: `id`, `title`, `path` do paczki.

`path` jest względne wobec katalogu `data/`, w którym znajduje się katalog JSON. Przykład: `klasa-4/historia/detektywi-przeszlosci/topic.json`. Loader powinien rozwiązywać je przez `new URL(entry.path, catalogUrl)`, nie względem bieżącego adresu ekranu. Z katalogu pobieramy najpierw same nazwy, a pełną paczkę dopiero po wyborze tematu.

## Paczka tematu

Wspólne pola główne:

- `schemaVersion`: `1.0`;
- `kind`: `topic`;
- `id`: stabilny identyfikator tematu;
- `grade`, `subjectId`, `language` (`pl-PL`);
- `title`, `summary`;
- `lessons[]`, `tasks[]`, `learningPath[]`, `mindMap`, `tests[]`.

Opcjonalne `$schema` wskazuje lokalny plik schematu dla edytora. W paczce jest to `../../../content.schema.json`. Aplikacja nie musi pobierać schematu do wyświetlania tematu.

### Lekcje

Każda lekcja ma `id`, `title`, `goals[]` oraz `paragraphs[]` z krótkimi tekstami. Wersja 1.0 nie interpretuje Markdown ani HTML. Poszczególne zadania wskazują powiązane lekcje przez `lessonIds`. Pozwala to po teście zaproponować powtórkę bez przypisywania wiedzy do numerów ekranów.

### Zadania — wspólna część

Każde zadanie ma:

- `id`: unikalne w paczce;
- `type`: rozpoznawany typ aktywności;
- `title`, `instruction`;
- `lessonIds`: niepusta lista istniejących lekcji;
- `explanation`: objaśnienie odpowiedzi lub sensu aktywności;
- opcjonalne `hint`: podpowiedź w nauce.

Treść nie określa, czy wynik pokazać natychmiast. O tym decyduje tryb aplikacji: w nauce możemy pokazywać wskazówki, w teście wyjaśnienia pojawiają się po zatwierdzeniu całości.

### Typy zadań

| type | Pola charakterystyczne | Zasada |
|---|---|---|
| `discovery` | `items`: id, text, explanation, opcjonalne icon | Odkrywanie kart, bez automatycznej oceny testowej. |
| `flashcards` | `cards`: id, front, back, opcjonalne icon | Fiszki, bez automatycznej oceny testowej. |
| `single-choice` | `options`, `correctOptionId` | Dokładnie jedna wskazana opcja. |
| `multiple-choice` | `options`, `correctOptionIds` | Zbiór zaznaczeń musi odpowiadać zbiorowi poprawnych ID. |
| `matching` | `pairs`: id, left, right, opcjonalne leftIcon; opcjonalne `leftLabel`, `rightLabel` | Połączone strony należą do tej samej pary. Etykiety określają nagłówki kolumn, bez zmiany klucza odpowiedzi. |
| `sorting` | `categories`, `items` z categoryId i explanation | Każdy element trafia do jednej wskazanej kategorii. |
| `ordering` | `items`, `correctOrder` | Poprawna odpowiedź to kolejność ID elementów. |
| `short-answer` | `acceptedAnswers`, `normalization` | Jedna z jawnie dopuszczonych odpowiedzi. |
| `number-answer` | `answer`, `tolerance`, `unit` | Wartość liczbowa w jednostce podanej obok pola. |

Zwykłe `items` i `options` zawierają `id`, `text` i ewentualnie `icon`. `icon` jest symbolicznym identyfikatorem, np. `letter`, a nie ścieżką do pliku albo kodem SVG. Fiszki mogą mieć `cards[].icon`; w parach `pairs[].leftIcon` ilustruje tylko lewą stronę, bez wizualnego wskazywania pary po prawej. Zadania `single-choice` i `short-answer` dopuszczają również `icon` na poziomie zadania (ilustracja przed odpowiedziami).

Zamknięty katalog `assets/illustrations.mjs` mapuje identyfikatory na lokalne SVG w `assets/illustrations/`. Brak znanej ikonki nie może uniemożliwiać rozwiązania zadania — opis tekstowy jest zawsze dostępny. Grafiki są dekoracyjne i nie zależą od poprawności odpowiedzi. Dowolne ścieżki obrazów, zewnętrzne adresy lub dźwięk wymagałyby osobnego rozszerzenia kontraktu.

### Przykład: pary

```json
{
  "id": "rzymskie-pary",
  "type": "matching",
  "title": "Znajdź zaginione pary",
  "instruction": "Wybierz kartę z dowolnej kolumny i jej parę z drugiej.",
  "lessonIds": ["wieki-i-liczby-rzymskie"],
  "explanation": "XIV = 14, IX = 9, XIX = 19.",
  "pairs": [
    {"id": "xiv", "left": "XIV", "right": "14"},
    {"id": "ix", "left": "IX", "right": "9"},
    {"id": "xix", "left": "XIX", "right": "19"}
  ]
}
```

Mechanizm zawsze pozwala rozpoczynać z obu stron. Kolumny można mieszać niezależnie, zachowując tożsamość par. Nie dodajemy flag `leftFirst` ani indeksów poprawnych kart.

### Kolejność i drag and drop

`correctOrder` to pełna permutacja identyfikatorów z `items`. Kolejność wejściowa może być pomieszana. Aplikacja ocenia ID, a nie etykiety ani aktualne numery wierszy. Mysz, dotyk i strzałki zmieniają tę samą odpowiedź; nie potrzebują osobnych formatów danych.

### Odpowiedzi tekstowe i liczbowe

`trim-collapse-casefold` oznacza usunięcie skrajnych białych znaków, scalenie ciągów białych znaków do jednej spacji i porównanie bez rozróżniania wielkości liter. Nie usuwamy polskich znaków ani nie zgadujemy synonimów. Przykładowo `babcia` i `babcią` należy jawnie wpisać do `acceptedAnswers`.

Dla liczb warunek to różnica bezwzględna nie większa niż `tolerance`. Zero oznacza dokładną odpowiedź. Jednostka jest częścią polecenia/prezentacji, nie wpisywanej liczby. Parser użytkownika powinien poprawnie obsłużyć polski przecinek dziesiętny; dane JSON zawsze przechowują liczbę, nie napis z jednostką. Ten dokument określa kontrakt, nie dostarcza jeszcze silnika oceniania.

### Ścieżka nauki

Opcjonalne `learningPlan` jest obsługiwane przez schemat, walidatory i silnik. Zawiera `defaults`, `requiredTypes`, katalog szablonów `steps` i uporządkowane wyprawy `lessons`. Krok lekcji wskazuje szablon przez `id`, pulę przez `taskIds` i opcjonalne nadpisania `title`, `types`, `count`, `hints`; lekcja wskazuje `lessonId` i może nadpisać `extraPractice`. Dokładny kontrakt, przykład i zapis postępu opisuje [organizacja nauki według tematów](learning-organization.md#organizacja-sterowana-przez-json--kontrakt).

Przy obecności `learningPlan` interfejs korzysta z niego zamiast dawnego przebiegu. `learningPath` i `learningVariants` nadal wyznaczają bank nauki oraz zachowują zgodność ze starymi paczkami i wcześniejszymi osiągnięciami. Pule nowych kroków muszą być rozłączne, mieścić co najmniej `count` kandydatów i zachowywać zakres lekcji oraz dozwolone typy. Walidatory sprawdzają wykonalność `requiredTypes` dla całego planu. Brak planu oznacza opisane niżej dotychczasowe zachowanie.

`learningPath` to uporządkowana lista ID zadań. Przykładowo po odkrywaniu źródeł następuje ich sortowanie. W przyszłości można zbudować kilka ścieżek, ale wersja 1.0 nie definiuje warunkowych rozgałęzień ani algorytmu adaptacyjnego.

Opcjonalne `learningVariants` mapuje ID kotwicy z `learningPath` na niepustą listę unikalnych ID **nowych alternatyw**, np. `{"rzymskie-pary": ["rzymskie-pary-inne"]}`. Wszystkie zadania muszą istnieć w `tasks`. Nie wpisujemy do listy samej kotwicy ani żadnego innego zadania z `learningPath`: renderer dodaje kotwicę do puli automatycznie. Wariant może należeć tylko do jednej kotwicy i musi mieć ten sam zbiór `lessonIds` co ona (kolejność nie ma znaczenia). Losowanie zmienia ćwiczenie, ale postęp i gwiazdki pozostają przypisane do stabilnej kotwicy — nie tworzymy nowych kroków ścieżki. Bez tego pola ścieżka działa jak dotąd.

Bez `learningPlan` silnik najpierw przydziela różne dostępne typy do zgodnych tematycznie etapów, następnie losuje konkretne zadania. Maksymalizuje liczbę typów, a nie ich udział w całym banku. Dawne dziewięć etapów „Detektywów przeszłości” pozwalało wybrać każdy typ dokładnie raz; obecny plan zapewnia dziewięć typów w skali 42 aktywności, bez takiego wymogu na pojedynczy temat. W krótszej powtórce gwarantowana jest maksymalna osiągalna różnorodność, nie obecność nieistniejących kandydatów. Kontynuacja zachowuje zapisane warianty i uwzględnia ich typy przy uzupełnianiu brakujących etapów. Historia innych typów nie jest kasowana po rozpoczęciu nowego obiegu jednego typu.

### Mapa myśli

`mindMap` jest drzewem. Każdy węzeł ma `id`, `title`, `text`, `children[]`. Liść ma pustą listę dzieci. Układ, kolory i rozwijanie gałęzi są odpowiedzialnością interfejsu.

### Testy

Definicja testu ma `id`, `title`, `questions[]`, `feedback`, `scoring`, `shuffleQuestions`, `timeLimitSeconds`.

Każde pytanie wskazuje `taskId` i dodatnią całkowitą liczbę `points`. Nie kopiujemy zadania do testu. Można ponownie używać zadań w różnych testach; zalecamy odrębne przykłady naukowe i sprawdzające, aby ograniczyć odtwarzanie zapamiętanych odpowiedzi.

`questions` jest bankiem wszystkich dopuszczonych kandydatów, a nie deklaracją liczby pytań wyświetlanych uczniowi. Opcjonalne `draw` określa kwoty losowania bez powtórzeń, np. `[{"lessonId": "wieki-i-liczby-rzymskie", "count": 2}]`. Lista musi być niepusta, `lessonId` musi wskazywać istniejącą lekcję i nie może się powtarzać, a `count` jest dodatnią liczbą całkowitą. Obiekty grup zawierają wyłącznie te dwa pola.

Przy `draw` każdy kandydat z `questions` musi przez swoje `lessonIds` należeć do **dokładnie jednej** wskazanej grupy: odrzucamy zarówno niepokryte pytania, jak i nakładanie się grup. Dodatkowe lekcje niewymienione w `draw` są dozwolone. Każda grupa musi mieć co najmniej `count` kandydatów; wszyscy kandydaci w tej samej grupie muszą mieć jednakowe `points` (różne grupy mogą mieć różną punktację). Dzięki temu maksymalny wynik jest znany przed losowaniem: suma `count × points` po grupach, a liczba pokazywanych pytań to suma kwot. Nie zmieniamy struktury wpisów `questions`: nadal są to tylko `{taskId, points}`. Bez `draw` test obejmuje cały bank, zgodnie z dotychczasowym zachowaniem; `shuffleQuestions` nadal steruje kolejnością, nie kwotami.

Losowanie dobiera najpierw możliwie wiele różnych ocenianych typów do miejsc wynikających z kwot lekcji, potem równoważy pozostałe miejsca i wybiera konkretne pytania bez duplikatów. W bieżącym banku 16 pytań zawiera co najmniej jedno każdego z siedmiu typów. Kwoty tematów i pokrycie typów mają pierwszeństwo przed unikaniem ostatnio użytych pytań; bez `draw` lista pytań pozostaje stała. Nie dodaje to nowych pól JSON ani sztywnej proporcji typów.

- `feedback`: w wersji 1.0 wyłącznie `after-submit`;
- `scoring`: `all-or-nothing` — komplet poprawnej odpowiedzi daje całą pulę punktów, brak punktów częściowych;
- `timeLimitSeconds: null`: brak limitu;
- `shuffleQuestions`: dotyczy kolejności pytań, nie klucza odpowiedzi.

Wynik, imię ucznia i historia odpowiedzi NIE należą do opublikowanego pliku tematu. Poprawne odpowiedzi w statycznym JSON są możliwe do podejrzenia — to platforma nauki, nie zabezpieczony system egzaminacyjny.

## Walidacja

```sh
python3 scripts/validate_data.py
python3 -m unittest discover -s tests -v
```

Wymagana biblioteka `jsonschema` znajduje się w `requirements-dev.txt`. Nie jest potrzebna na urządzeniu dziecka ani na hostingu statycznym.

JSON Schema Draft 2020-12 sprawdza pola, typy, wymagane wartości, wersję kontraktu i odrzuca nieznane pola. Walidator Python sprawdza dodatkowo:

- unikalność ID;
- referencje do lekcji i zadań;
- istnienie poprawnych opcji i kategorii;
- kompletność kolejności;
- brak zadań nieocenianych w testach;
- poprawność kotwic i wariantów nauki oraz zgodność ich zbiorów lekcji;
- unikalność grup losowania, pełne i rozłączne pokrycie banku, dostępność kwot i jednolitą punktację w grupach;
- zgodność katalogu z paczkami i folderami;
- brak tematów pominiętych w katalogu;
- brak ścieżek wychodzących poza `data/`;
- powtórzone klucze JSON i niedozwolone wartości typu NaN.

Walidacja nie ustala, czy data historyczna jest prawdziwa albo czy zadanie jest pedagogicznie dobre. To pozostaje częścią przeglądu treści.

## Dodanie kolejnego tematu

1. Utwórz `data/klasa-N/przedmiot/temat/topic.json`.
2. Skorzystaj ze struktury istniejącego pliku, nadając nowe metadane i ID.
3. Opracuj autorskie lekcje i zadania z objaśnieniami. Materiały źródłowe wyznaczają zakres, nie są kopiowane 1:1.
4. Uzupełnij `learningPath`, warianty banku nauki, mapę myśli i definicje testów. Dla wypraw tematycznych dodaj `learningPlan` ze wspólnymi szablonami i rozłącznymi pulami kroków wszystkich lekcji. Samo dopisanie lekcji wymaga również dodania jej wyprawy, jeśli plan już istnieje.
5. Dodaj wpis do odpowiedniej klasy/przedmiotu w `catalog.json`.
6. Uruchom walidator i testy oraz przejrzyj treść merytorycznie.

Jeżeli potrzebny jest nowy typ zadania, dodaj jego definicję do schematu, walidację semantyczną, testy i obsługę w aplikacji. Nieznanego typu aplikacja nie może po cichu traktować jako quizu. Zmiana niezgodna wstecznie wymaga nowej wersji kontraktu.
