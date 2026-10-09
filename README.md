# Easyvocab

## Deploy to Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint**, connect the repository, and apply `render.yaml`.
3. Create a PostgreSQL database in Render (or use a PostgreSQL provider) and set its connection string as `DATABASE_URL`. Use the provider's internal connection string when the database and web service are in the same Render region.
4. Set the prompted environment variables:
   - `ADMIN_EMAIL`: email address that should receive the admin role when signing in with Google.
   - `GOOGLE_CLIENT_ID`: OAuth client ID configured for the deployed domain.
   - `FACEBOOK_APP_ID`: Facebook app ID (optional if Facebook login is not used).
   - `GMAIL_USER` and `GMAIL_APP_PASS`: Gmail account and app password for password-reset emails.
5. Wait for the deploy to finish. Render will show the public `https://...onrender.com` URL in the service dashboard.

The server fails to start if `DATABASE_URL` is not configured. The first successful start creates the required tables. Keep database credentials private and enable automated backups for production.

For local development, set `DATABASE_URL` to a private PostgreSQL instance before running `npm start`.

GitHub Actions runs JavaScript syntax checks and an npm dependency audit on pushes and pull requests to `main`, with a scheduled audit every Monday. Review failures and update affected dependencies before deploying.

The server sets Helmet security headers, limits JSON request bodies to 1 MB, verifies the origin of state-changing API requests, and rate-limits login, OAuth, OTP, and learning-data writes. Sessions, users, learning data, OTP records, and rate-limit counters are stored in PostgreSQL and shared across service instances. Session cookies are HttpOnly, SameSite=Lax, and expire after 24 hours; their server-side records are revocable. OTP codes expire after five minutes, can be resent after 60 seconds, and allow at most five guesses. The CSP blocks inline scripts, inline event handlers, and `eval`; Tailwind is compiled during the Render build. Inline style attributes are still allowed for existing presentation details.

The homepage uses the VocabMind learning dashboard in `public/index.html`; its application code and custom CSS are in `public/app.js` and `public/styles.css`. Google and Facebook sign-in create an account on first successful sign-in. Set `GOOGLE_CLIENT_ID` and `FACEBOOK_APP_ID` in Render to enable the corresponding buttons. Signed-in users' vocabulary, decks, review progress, and profile progress sync to PostgreSQL across devices; local browser storage remains as the offline/guest cache. The first sign-in after this update uploads the current browser's learning data if no server copy exists. Browser storage does not contain the authenticated email or session token. Run `npm run build:css` after changing utility classes or the styles source.

Create and manage vocabulary decks from the **Kho Từ Vựng** tab. Deck names and vocabulary are saved in the browser cache and, when signed in, synchronized to the account. Newly created decks are available in the flashcard selector. Select a deck to select all its words or delete the deck; deleting a deck requires confirmation and permanently deletes its words from the active browser/account data.

The vocabulary importer accepts Excel, CSV, TXT, PDF, and Word `.docx` files. It recognizes common English/Vietnamese meaning and IPA/pronunciation column names regardless of their order. An optional `Topic`/`Chủ đề` column can specify one of the app's vocabulary topics; when absent or unrecognized, a topic is suggested from the word, meaning, and example. You can filter and group the vocabulary table by topic and correct a suggestion from each row. Existing browser-saved records are assigned a topic locally on first load; vocabulary sets are not changed. Document imports need selectable text and a table with English/Word and Meaning/Translation columns, or text lines in the form `word | meaning`. Scanned image-only PDFs and legacy `.doc` files are not supported. Existing saved records with IPA in the meaning field are corrected automatically when the IPA and meaning fields are clearly swapped; practice modes omit records whose Vietnamese meaning is still missing.

The built-in sample words use British English IPA (Anh-Anh). When existing browser data contains the previous sample transcriptions, the app updates those defaults once while preserving custom IPA values. Existing and newly imported slash-delimited IPA transcriptions are compacted to remove accidental spaces between phonetic symbols while retaining word boundaries, stress marks, syllable dots, and length marks.

On startup, the app repairs six identifiable truncated rows from the imported **IELTS 7.0** deck using the supplied source pages. The repair only matches the known broken word/meaning fragments in that deck and preserves each record's ID, IPA, review progress, and other fields.

The dashboard's seven-day spaced-repetition line chart is calculated from each reviewed word's saved `nextReview` date. Rating a flashcard updates its next review time: again in under a minute, hard in one day, good in three days, and easy in seven days. An identifiable imported typo, `Tra c light`, is normalized to `Traffic light` without changing its other fields. Edit a word from its row in **Kho Từ Vựng**, or select exactly one checkbox and use **Sửa Từ** in the selection toolbar; changes preserve the word's ID and spaced-repetition progress. The selection toolbar also supports bulk deletion and clearing the selection.

The **Minigame** tab includes the original timed word-meaning matching game plus **Xáo chữ** (unscramble an English word from its Vietnamese meaning) and **Đúng hay sai** (judge a word-meaning pair). Each game runs for 30 seconds and uses the existing score, combo, and XP system.

The cookie notice explains that the HttpOnly `session_token` cookie maintains sign-in sessions. The notice stores the user's choice (`all` or `necessary`) and theme preference in browser storage, and can be reopened from **Cài đặt cookie**. Guest learning data and the offline cache also use browser storage; signed-in learning data is synchronized to PostgreSQL. The app currently does not use analytics or advertising cookies.
