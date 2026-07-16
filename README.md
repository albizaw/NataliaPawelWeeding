# 💍 Natalia & Paweł — strona ślubna

Nowoczesna, elegancka strona weselna (18.07.2026) z:

- ✨ **animacją powitalną** „Wzięliśmy ślub!” ze spadającymi płatkami i obrączkami,
- 🖼️ **Waszym zdjęciem jako tłem** (z nowoczesną, delikatną przezroczystością i przyciemnieniem dla czytelności),
- 🕒 **harmonogramem wesela** jako ozdobną osią czasu (godziny + wydarzenia z ikonami),
- 🍽️ **pełnym menu weselnym** z podziałem na dania (przystawka, zupa, danie główne, I i II kolacja) oraz oznaczeniami dań klasycznych, wegetariańskich i dla dzieci,
- 📸 **wgrywaniem zdjęć z wesela** przez gości (prosto z telefonu),
- 🖼️ **galerią** ze zdjęciami (podgląd na pełnym ekranie po kliknięciu).

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

Wygenerowany adres udostępnij gościom (np. na zaproszeniach lub karteczkach na stołach) — po wejściu od razu wgrają swoje zdjęcia. 🎉

---

## 3. Galeria zdjęć — tryby działania

Strona ma **trzy tryby** galerii (wybierany automatycznie na podstawie konfiguracji
w `js/main.js`):

| Tryb | Kiedy | Efekt |
|------|-------|-------|
| **Lokalny** (domyślny) | brak konfiguracji | ⚠️ każdy gość widzi tylko własne zdjęcia (zapis w `localStorage` jego telefonu) |
| **Supabase** (zalecany) | wypełnisz `SUPABASE_URL` + `SUPABASE_ANON_KEY` | ✅ wspólna galeria — wszyscy goście widzą wszystkie zdjęcia |
| **Własne API** | ustawisz `GALLERY_ENDPOINT` | wspólna galeria przez własny backend |

### 3a. Wspólna galeria przez Supabase (zalecane) 💛

Darmowe, bez karty, storage + reguły bezpieczeństwa w jednym. Konfiguracja zajmuje
kilka minut:

**1) Załóż projekt**
Wejdź na [supabase.com](https://supabase.com) → *New project*. Zapisz hasło do bazy.

**2) Utwórz bucket na zdjęcia**
Menu **Storage** → *New bucket* → nazwa **`natalia-pawel-photos`** → zaznacz **Public bucket**
→ *Create*.

**3) Ustaw reguły bezpieczeństwa (policies)**
Menu **Storage → Policies** przy buckecie `natalia-pawel-photos` dodaj dwie polityki dla
roli `anon` (można też przez SQL Editor — wklej poniższe):

```sql
-- Goście mogą DODAWAĆ zdjęcia do bucketu natalia-pawel-photos
create policy "natalia pawel upload"
  on storage.objects for insert to anon
  with check ( bucket_id = 'natalia-pawel-photos' );

-- Goście mogą LISTOWAĆ/oglądać zdjęcia z tego bucketu
create policy "natalia pawel read"
  on storage.objects for select to anon
  using ( bucket_id = 'natalia-pawel-photos' );
```

> Nazwy polityk (`natalia pawel upload` / `read`) są celowo unikalne — jeśli w tym
> samym projekcie Supabase jest już bucket innej pary z własnymi politykami,
> identyczna nazwa spowodowałaby błąd „policy already exists”.

> Uwaga bezpieczeństwo: świadomie **nie** dodajemy polityk `update`/`delete` dla gości —
> nikt nie może kasować ani podmieniać cudzych zdjęć. Moderację (usuwanie spamu)
> robicie sami w panelu **Storage** Supabase.

**4) Skopiuj klucze**
Menu **Project Settings → API**: skopiuj **Project URL** oraz klucz **`anon` `public`**.

**5) Wklej do `js/main.js`** (na górze pliku):

```js
var SUPABASE_URL = "https://twoj-projekt.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOi...";   // klucz anon public
var SUPABASE_BUCKET = "natalia-pawel-photos";
```

Gotowe — po wgraniu na GitHub Pages wszyscy goście dzielą jedną galerię. Klucz
`anon public` jest **z założenia jawny** (widać go w kodzie strony); bezpieczeństwo
zapewniają polityki z kroku 3, a nie ukrywanie klucza. Dodatkowo strona odrzuca
pliki większe niż 20 MB i skaluje zdjęcia przed wysłaniem.

### 3b. Alternatywnie: własne API

Zamiast Supabase możesz ustawić `GALLERY_ENDPOINT` na adres własnego backendu:

```js
var GALLERY_ENDPOINT = "https://twoje-api.example.com/photos";
```

API powinno obsługiwać:

- `GET`  → zwraca `{"images": [{ "id": "...", "src": "<data-url-lub-url>" }, ...]}`
- `POST` z ciałem `{"image": "<data-url>"}` → zapisuje nowe zdjęcie.

---

## 4. Struktura projektu

```
index.html            – strona
css/style.css         – wygląd (motyw rustykalny: len + drewno + złoto + szałwia)
js/main.js            – animacje, upload, galeria, lightbox
images/placeholder.svg – placeholder zdjęć w hero (podmień na własne kadry)
```

---

Zrobione z ❤️ dla Natalii i Pawła.
