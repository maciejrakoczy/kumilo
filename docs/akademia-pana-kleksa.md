# „Akademia pana Kleksa” — zakres i opracowanie

## Źródła i granice

Zakres wyznacza siedem zdjęć z lokalnego katalogu `materiały/klasa iv/język polski/akademia pana kleksa/`: karty pracy o Akademii, narratorze, profesorze, Mateuszu, planie wydarzeń i baśniowości oraz notatki z zeszytu. Część fotografii przedstawia te same zagadnienia. Odpowiedzi odręczne, zaznaczenia i numeracja ucznia nie są kluczem.

Szczegóły sprawdzono w tekście Jana Brzechwy: [Akademia pana Kleksa — PDF](https://www.sredniawies.pl/lektury/akademia_pana_kleksa.pdf). Plik obejmuje również kolejne książki; źródłem tego działu jest wyłącznie pierwsza opowieść, do finału z zamknięciem książki. Nie przenosimy wydarzeń z filmów ani kontynuacji.

Publikowane opisy, polecenia, przykłady językowe, odpowiedzi i objaśnienia są autorskim opracowaniem. Fotografie, ilustracje kart pracy i pełny tekst książki nie są częścią paczki publikacyjnej. Dział wspiera powtórkę zakresu szkolnych materiałów, nie zastępuje przeczytania całej lektury i nie deklaruje omówienia każdego jej wątku.

## Pokrycie umiejętności

Każdy wiersz odpowiada osobnej lekcji i wyprawie. Zadania nauki oraz odrębne pytania sprawdzianu mają tę samą referencję `lessonIds`; dzięki niej błędna odpowiedź kieruje do właściwej powtórki.

| Lekcja | Cel | Praktyka i sprawdzian |
| --- | --- | --- |
| `witaj-w-akademii` | Poznać miejsce, budynek, reguły szkoły i alfabet | Dopasowanie pomieszczeń, rozpoznanie zasad, kolejność imion przy tej samej pierwszej literze |
| `adas-opowiada` | Odróżnić autora, narratora i bohatera; rozpoznać narrację pierwszoosobową | Poszukiwanie śladów udziału narratora, odczytanie przyczyn decyzji rodziców |
| `portret-profesora` | Opisać wygląd i ubiór, odróżnić wygląd od charakteru i umiejętności | Pary element–opis, liczby kieszeni, znaczenie świdrującego spojrzenia |
| `sekrety-kleksa` | Rozpoznać przedmioty z kamizelki, ich działanie oraz przysmaki | Zawartość kieszeni, funkcje przedmiotów, odróżnienie przysmaków profesora i Mateusza |
| `szpak-mateusz` | Poznać rolę Mateusza i rozumieć różnicę między jego opowieścią a finałem | Obowiązki pomocnika, sposób mówienia, interpretacja przemiany |
| `niezwykle-lekcje` | Rozpoznać naukę i codzienność Akademii | Powiązanie zajęć z czynnościami, rozpoznawanie niezwykłych metod |
| `plan-wydarzen` | Rozpoznawać przygody i odróżniać czas zdarzeń od kolejności opowiadania | Wizyta u Śpiącej Królewny, Królewna Żabka, księżycowi ludzie, części Alojzego w walizce; wyraźnie wskazany porządek układania |
| `rzeczywistosc-i-basn` | Rozróżniać realizm i fantastykę oraz rozumieć wybrane środki językowe | Porównania, przenikliwe spojrzenie, różne powiedzenia o rękach, negacja w poleceniach, formy czasownika |

## Język dla klasy IV

Odbiorcy mają 10–11 lat. Polecenia są krótkie i bezpośrednie; nie używamy języka recenzji nauczycielskiej ani specyfikacji. Terminy z programu (narrator, narracja pierwszoosobowa, porównanie, bezokolicznik) pozostają, ale mają proste objaśnienia i przykłady. Scenki spoza lektury są wyraźnie oznaczone. Przy pytaniach z negacją wyróżniamy słowo NIE.

Korekta zachowuje 8 lekcji, 48 kroków, 128 aktywności nauki i osobny bank 64 zadań testowych. Braki ze skanów uzupełniono przez zastąpienie 18 powtarzalnych zadań, bez pompowania liczby pozycji. Zadania o nowym znaczeniu mają nowe ID i są podłączone do istniejących pul i testu; identyfikatory lekcji i kroków pozostają bez zmian. Nie kasujemy postępu ani nie modyfikujemy silnika oceniania. Krótkie odpowiedzi mają jawnie zapisane poprawne warianty, np. „w nici” i „w nitki”.

Testy pokrycia i kluczy: `tests/kleks-source-coverage.test.mjs`. Sprawdzają fakty, rzeczywiste podłączenie zadań do nauki i sprawdzianu, poprawne synonimy oraz brak objaśnień zależnych od losowej pozycji odpowiedzi.

## Ustalenia merytoryczne

- Bezpośrednim impulsem do oddania Adasia do Akademii jest oblanie atramentem spodni, obrusu i nowego kostiumu mamy. Jego wcześniejsze trudności stanowią tło, a nie zastępują tego zdarzenia.
- Na parterze są sale szkolne; na pierwszym piętrze sypialnie i wspólna jadalnia; na drugim pokój profesora i Mateusza oraz zamknięte pokoje; na trzecim sekrety. Schody kończą się na drugim piętrze, profesor korzysta z komina.
- Cytrynowa jest kamizelka, czekoladowy lub bordowy jest surdut; broda jest czarna, wąsy pomarańczowe, włosy wielobarwne. Nie mylimy materiału ubrania z kolorem.
- Mateusz opowiada o sobie jako o księciu. W finale, po przemianie w człowieka, przedstawia się jako autor opowieści i nazywa historię o księciu zmyśloną. Pytanie musi wskazywać, której warstwy opowieści dotyczy.
- Senny kwas służy do zebrania snów z lusterek; dopiero z wysuszonych snów powstają pastylki. Nie przypisujemy mu automatycznie usypiania uczniów.
- Zielony płyn przywraca profesorowi pamięć utraconą podczas snu. Powiększająca pompka działa, gdy istnieje rzeczywista potrzeba, a jej skutek ustaje wraz z tą potrzebą; nie powiększa dowolnie każdego deseru.
- W opisie poranka pobudka przypada na 5:00, śniadanie na 5:30, apel na 6:00, a początek lekcji na 7:00. Nie uzupełniamy nieczytelnych godzin z zeszytu domysłem.
- Wigilia poprzedza odkrycie zniszczeń w sekretach i rozmontowanie Alojzego. Akademia zaczyna jednak maleć wcześniej; nie przedstawiamy wszystkich zmian jako skutku jednego późniejszego zdarzenia.
- Nie kwalifikujemy samego faktu bycia uczniem albo ptakiem jako fantastyki. O niezwykłości świadczy konkretna właściwość, np. magiczna przemiana lub sposób porozumiewania się.
- Autorski przykład językowy powinien być wyraźnie odróżniony od wydarzenia lub cytatu z książki. Nie traktujemy każdego zdania z bezokolicznikiem jako zawierającego wyłącznie formy bezosobowe.
- W zdaniu „Nie wolno otwierać drzwi” nie ma osobowej formy czasownika. W zdaniu „Adaś chce otworzyć drzwi” bezokolicznikowi towarzyszy osobowa forma „chce”. Formy zakończone na `-no`, `-to` nie wyczerpują zagadnienia nieosobowości.
- Porządek krótkich sekwencji musi wynikać z książki albo jednoznacznego polecenia. Kolejność opowiadania nie jest automatycznie chronologią zdarzeń we wspomnieniach Mateusza.
- Podobna pułapka dotyczy lotu Adasia do psiego raju: chłopiec opowiada o wcześniejszej przygodzie w trakcie relacjonowania dnia zajęć. Nie ustawiamy samego lotu po poszukiwaniu skarbów tylko dlatego, że w tym miejscu pojawia się jego opowieść. Odczytanie snu o siedmiu szklankach również nie jest chwilą, kiedy ten sen się przyśnił.

## Organizacja i kontrola

Paczka: `data/klasa-4/jezyk-polski/akademia-pana-kleksa/topic.json`. Dostęp przez klasę IV i przedmiot „Język polski” w [katalogu](../data/catalog.json).

Stosujemy istniejący [kontrakt JSON](data-format.md) i [organizację nauki](learning-organization.md): Odkryj → Zapamiętaj → Rozpoznaj → Połącz → Zastosuj → Utrwal. Nie wymuszamy odpowiedzi liczbowych w dziale literackim. Fiszki i odkrywanie pozostają poza ocenianym sprawdzianem. Test ujawnia poprawność dopiero po zatwierdzeniu całości.

Kontrole automatyczne: `npm test` i `npm run build`; test banku to `tests/kleks-bank.test.mjs`. Scenariusz `tests/kleks-browser.mjs` należy uruchomić osobno w przeglądarce przez eksport `runKleksChecks()`. Obejmuje renderowanie i rozwiązanie wszystkich zadań, pełną wyprawę, kontynuację po zmianie przedmiotu, lekcje i mapę oraz losowany sprawdzian. Nie zastępuje przeglądu pedagogicznego ani próby dotyku na fizycznym telefonie.
