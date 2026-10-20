# Sowa Kumilo — znak i maskotka

Wspólny plik: `assets/owl.svg`. To sowa z zaakceptowanego wariantu „Wyprawa w przeszłość”, wydzielona do jednego zasobu zamiast powielania SVG w ekranach.

Zastosowania:
- logo przy nazwie Kumilo w nagłówku;
- ikona strony (favicon);
- duża maskotka na starcie tematu;
- mała przewodniczka przy wskazówkach i objaśnieniach;
- towarzyszka podsumowania wyprawy i testu.

Sowa nie ma imienia własnego. Wariant `assets/owl-sad.svg`, dodany na życzenie użytkownika, pokazuje smutek przy błędzie; krótki ruch i łezkę zapewnia interfejs. Nie zmieniamy kolorów sowy zależnie od przedmiotu.

Dekoracyjne wystąpienia mają pusty tekst alternatywny. Przycisk powrotu na start ma własną nazwę dostępną „Kumilo — wróć na start”. Znaczące teksty podpowiedzi są zwykłym tekstem obok ilustracji; nie są zakodowane wyłącznie w obrazku.

Znak i kolory aplikacji są lokalne, bez pobierania fontów, obrazów lub skryptów z usług zewnętrznych.

## Ilustracje zadań

`assets/illustrations/` zawiera autorskie, lokalne SVG w zaokrąglonej stylistyce sówki, ale z naturalnymi kolorami: odcieniami skóry i włosów, różnokolorowymi ubraniami, brązem drewna i ceramiki, kremowym papierem oraz szarością kamienia. Delikatne tła i złote gwiazdki łączą zestaw wizualnie, bez narzucania fioletu wszystkim przedmiotom. Sowa i interfejs zachowują własną paletę. Zestaw obejmuje trzy portrety osób z zadania rodzinnego i grupę rodzinną, pięć symboli epok, list, garnek, ustną opowieść, dziennik, guzik i lupę.

Symbole epok są ilustracyjnymi skojarzeniami, nie ich definicjami ani dokładnymi granicami: prehistoria — kamienne narzędzie; starożytność — kolumna; średniowiecze — zamek; nowożytność — żaglowiec; współczesność — radio. Portrety występują wyłącznie po stronie osób w zadaniu par, bez powtarzania grafiki po stronie odpowiedzi.

Identyfikatory ilustracji pochodzą z JSON, a ich zamknięty katalog obsługuje `assets/illustrations.mjs`. Obrazki mają puste `alt`, ponieważ tekst pytania lub karty opisuje ten sam element. Nie zastępują podpisów, kolejności ID ani kluczy odpowiedzi.
