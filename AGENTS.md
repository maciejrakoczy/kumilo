# Kumilo — zasady pracy

Statyczna aplikacja edukacyjna: HTML/CSS/JS + JSON, bez backendu i zależności npm. Odpowiadaj po polsku, krótko.

## Oszczędzanie kontekstu
- Czytaj tylko pliki i fragmenty potrzebne do zadania. Najpierw wyszukaj symbol/ścieżkę; niezależne odczyty łącz. Nie skanuj całego repo ani historii bez potrzeby.
- Dokumentację poniżej otwieraj tylko dla danego obszaru; nie czytaj całej na start. Nie wczytuj całego banku JSON, gdy wystarczy wyszukanie ID i fragment.
- Nie powtarzaj odczytów bez powodu. Kod i bieżący Git są źródłem stanu; historia rozmów służy tylko do brakujących ustaleń.
- Mała zmiana = krótka realizacja i wynik, bez rozbudowanego planu, delegacji i relacjonowania każdego kroku. Nie oszczędzaj na niezbędnej weryfikacji.
- Podsumuj zmianę, wynik kontroli i ewentualny bloker; wskazuj plik:linia zamiast wklejać kod/logi.

## Mapa — szczegóły na żądanie
- `assets/app.mjs`: nawigacja/nauka/test; `assets/activity-view.mjs`, `assets/activity.css`: wspólna karta; `assets/tasks.mjs`: zadania.
- `assets/core.mjs`: model/ocena/zapis; `assets/selection.mjs`: losowanie; `assets/reorder.mjs`: kolejność; `assets/rewards.mjs`: nagrody.
- Treści: `data/catalog.json`, `data/content.schema.json`, `data/klasa-N/przedmiot/temat/topic.json`. Kontrakt: `docs/data-format.md`; bank: `docs/question-bank.md`.
- Zachowanie/UX: `docs/application.md`; grafika: `docs/branding.md`; publikacja: `docs/publication.md`; środowisko: `README.md`; zasady repo: `CONTRIBUTING.md`.

## Stałe ustalenia
- Treści tylko w JSON, niezależnie od UI. `materiały/` wyznaczają zakres; opracowuj autorskie treści, bez kopiowania 1:1. Zachowuj ID przy niezmienionym znaczeniu (postęp).
- Styl „Wyprawa w przeszłość”: mało tekstu, nauka przez działanie. Wspólna biała karta, punktowy postęp, stała stopka; pary z numerami i liniami.
- `assets/owl.svg` to wspólne logo/maskotka; błędy: smutna sowa, sukces: nagrody. Ilustracje zaokrąglone, naturalne kolory. Respektuj ograniczenie ruchu i klawiaturę.
- W teście nie ujawniaj poprawności przed zatwierdzeniem całości. Nie dodawaj komunikatów typu „Bez stopera”.
- Zmieniaj tylko zakres zadania, bez zbędnych zależności. Nie commituj/pushuj bez prośby. Nie czytaj sekretów.
- `local-server/` i `materiały/` pozostają lokalne, poza Git/publikacją. Nie edytuj `dist/`; publikuj wyłącznie jego zawartość.

## Weryfikacja
Po zmianach kodu/danych: `npm test` i `npm run build`. Zależności Pythona: `requirements-dev.txt`; bez `npm install`. Zmiany UI sprawdź też w przeglądarce (mobilnie/klawiatura); `npm test` nie uruchamia scenariuszy przeglądarkowych. Dla samych MD sprawdź odnośniki i diff, bez pełnego zestawu testów. Nie deklaruj kontroli, których nie wykonano.
