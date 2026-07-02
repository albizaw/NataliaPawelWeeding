# 💍 Natalia & Paweł — strona ślubna

Nowoczesna, elegancka strona weselna (DD.MM.RRRR) z:

- ✨ **animacją powitalną** „Wzięliśmy ślub!” ze spadającymi płatkami i obrączkami,
- 🖼️ **Waszym zdjęciem jako tłem** (z nowoczesną, delikatną przezroczystością i przyciemnieniem dla czytelności),
- 🍽️ **pełnym menu weselnym** ułożonym jako oś czasu (godziny + dania),
- 📸 **wgrywaniem zdjęć z wesela** przez gości (prosto z telefonu),
- 🖼️ **galerią** ze zdjęciami (podgląd na pełnym ekranie po kliknięciu),
- 🔳 **generatorem kodu QR** na stoły — do wydruku.

Strona to zwykłe pliki HTML/CSS/JS (bez budowania), więc można ją postawić za darmo
np. na **GitHub Pages**.

---

## 1. Dodaj swoje zdjęcia

W sekcji powitalnej (hero) są **dwa kadry** — na start pokazują neutralny
placeholder (`images/placeholder.svg`). Aby wstawić własne zdjęcia:

1. Wrzuć swoje pliki do folderu `images/` (np. `hero-main.jpg` i `hero-sub.jpg`).
2. W `index.html`, w sekcji `class="hero__photos"`, podmień `src` obu obrazków:

```html
<figure class="photo photo--main">
  <img src="images/hero-main.jpg" width="..." height="..." alt="Zdjęcie pary" ... />
</figure>
<figure class="photo photo--sub">
  <img src="images/hero-sub.jpg" width="..." height="..." alt="Zdjęcie pary" ... />
</figure>
```

> Wskazówka: najlepsze będą zdjęcia pionowe (portretowe) o dobrej jakości.
> Uzupełnij `width`/`height` prawdziwymi wymiarami pliku, aby uniknąć przeskoku
> układu podczas ładowania.

---

## 2. Publikacja (GitHub Pages)

1. Wejdź w **Settings → Pages** w repozytorium.
2. W sekcji *Build and deployment* wybierz **Deploy from a branch**.
3. Ustaw branch (np. `main`) i katalog `/root`, zapisz.
4. Po chwili strona będzie dostępna pod adresem typu:
   `https://twoj-login.github.io/nazwa-repo/`

Ten sam adres wpisz w generatorze kodu QR (patrz niżej).

---

## 3. Kod QR na stoły

W sekcji **„Kod QR na stoły”** na stronie:

1. Wpisz adres swojej opublikowanej strony (pole podpowiada bieżący adres).
2. Kliknij **„Wygeneruj kod QR”**.
3. Kliknij **„Pobierz do druku”** — otrzymasz gotową kartę PNG
   z kodem, Waszymi imionami i datą. Wydrukuj i połóż na stołach.

Goście po zeskanowaniu trafią na stronę i będą mogli od razu wgrać zdjęcia. 🎉

Kod QR generowany jest **lokalnie w przeglądarce** (biblioteka
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), licencja MIT) —
działa też bez internetu i jest w pełni skanowalny.

---

## 4. Galeria zdjęć — tryby działania

Strona ma **trzy tryby** galerii (wybierany automatycznie na podstawie konfiguracji
w `js/main.js`):

| Tryb | Kiedy | Efekt |
|------|-------|-------|
| **Lokalny** (domyślny) | brak konfiguracji | ⚠️ każdy gość widzi tylko własne zdjęcia (zapis w `localStorage` jego telefonu) |
| **Supabase** (zalecany) | wypełnisz `SUPABASE_URL` + `SUPABASE_ANON_KEY` | ✅ wspólna galeria — wszyscy goście widzą wszystkie zdjęcia |
| **Własne API** | ustawisz `GALLERY_ENDPOINT` | wspólna galeria przez własny backend |

### 4a. Wspólna galeria przez Supabase (zalecane) 💛

Darmowe, bez karty, storage + reguły bezpieczeństwa w jednym. Konfiguracja zajmuje
kilka minut:

**1) Załóż projekt**
Wejdź na [supabase.com](https://supabase.com) → *New project*. Zapisz hasło do bazy.

**2) Utwórz bucket na zdjęcia**
Menu **Storage** → *New bucket* → nazwa **`wedding-photos`** → zaznacz **Public bucket**
→ *Create*.

**3) Ustaw reguły bezpieczeństwa (policies)**
Menu **Storage → Policies** przy buckecie `wedding-photos` dodaj dwie polityki dla
roli `anon` (można też przez SQL Editor — wklej poniższe):

```sql
-- Goście mogą DODAWAĆ zdjęcia do bucketu wedding-photos
create policy "wedding upload"
  on storage.objects for insert to anon
  with check ( bucket_id = 'wedding-photos' );

-- Goście mogą LISTOWAĆ/oglądać zdjęcia z tego bucketu
create policy "wedding read"
  on storage.objects for select to anon
  using ( bucket_id = 'wedding-photos' );
```

> Uwaga bezpieczeństwo: świadomie **nie** dodajemy polityk `update`/`delete` dla gości —
> nikt nie może kasować ani podmieniać cudzych zdjęć. Moderację (usuwanie spamu)
> robicie sami w panelu **Storage** Supabase.

**4) Skopiuj klucze**
Menu **Project Settings → API**: skopiuj **Project URL** oraz klucz **`anon` `public`**.

**5) Wklej do `js/main.js`** (na górze pliku):

```js
var SUPABASE_URL = "https://twoj-projekt.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOi...";   // klucz anon public
var SUPABASE_BUCKET = "wedding-photos";
```

Gotowe — po wgraniu na GitHub Pages wszyscy goście dzielą jedną galerię. Klucz
`anon public` jest **z założenia jawny** (widać go w kodzie strony); bezpieczeństwo
zapewniają polityki z kroku 3, a nie ukrywanie klucza. Dodatkowo strona odrzuca
pliki większe niż 20 MB i skaluje zdjęcia przed wysłaniem.

### 4b. Alternatywnie: własne API

Zamiast Supabase możesz ustawić `GALLERY_ENDPOINT` na adres własnego backendu:

```js
var GALLERY_ENDPOINT = "https://twoje-api.example.com/photos";
```

API powinno obsługiwać:

- `GET`  → zwraca `{"images": [{ "id": "...", "src": "<data-url-lub-url>" }, ...]}`
- `POST` z ciałem `{"image": "<data-url>"}` → zapisuje nowe zdjęcie.

---

## 5. Struktura projektu

```
index.html            – strona
css/style.css         – wygląd (motyw rustykalny: len + drewno + złoto + szałwia)
js/main.js            – animacje, upload, galeria, lightbox, QR
js/qrcode.js          – generator kodu QR (MIT, Kazuhiko Arase) + wrapper
images/placeholder.svg – placeholder zdjęć w hero (podmień na własne kadry)
```

---

Zrobione z ❤️ dla Natalii i Pawła.
