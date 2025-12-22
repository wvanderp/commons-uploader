You want a practical, end-to-end recipe to upload a photo to **Wikimedia Commons** via the API, using **OAuth 2.0**, including exactly which **grants/scopes** to request, and how to make it work from a browser with **CORS**.

Below is the full flow (registration → OAuth2 → CSRF token → upload), with the exact URLs + parameters you’ll send.

---

## 1) Which endpoints you’ll use

### OAuth 2.0 (authorization server)

Wikimedia’s OAuth2 auth server is on **Meta-Wiki** (even if you’re uploading to Commons). ([api.wikimedia.org][1])

```text
Authorization endpoint (GET):
https://meta.wikimedia.org/w/rest.php/oauth2/authorize

Token endpoint (POST):
https://meta.wikimedia.org/w/rest.php/oauth2/access_token
```

The MediaWiki OAuth extension documents the REST endpoints and their allowed parameters. ([MediaWiki][2])

### Commons upload API (resource server)

Uploads go to the **Commons Action API**:

```text
https://commons.wikimedia.org/w/api.php
```

The upload module is `action=upload` and it must be a **POST** with `multipart/form-data`. ([MediaWiki][3])

---

## 2) Pick the OAuth2 grants (scopes) you need

On Wikimedia, “scopes” are basically **grants** like `basic`, `uploadfile`, etc. Meta has the authoritative list and what each grant allows. ([meta.wikimedia.org][4])

### Minimum for uploading a new file

* `basic` (baseline access) ([meta.wikimedia.org][4])
* `uploadfile` (“Upload new files”) ([meta.wikimedia.org][4])

### Common optional add-ons

* `editpage` if your app also edits pages beyond the initial upload context (e.g., follow-up edits, adding categories later via `action=edit`). ([meta.wikimedia.org][4])
* `highvolume` if you’re doing bot-like high volume and have approval/need higher limits. ([meta.wikimedia.org][4])

In practice, a safe “normal uploader app” scope set is usually:

```text
basic uploadfile
```

…and add `editpage` only if you truly need post-upload edits.

---

## 3) Create OAuth2 credentials (client_id / secret)

Create a client in the Wikimedia API Keys dashboard (OAuth2 authorization code flow is the one you want for “on behalf of the user”). ([api.wikimedia.org][1])

You’ll end up with:

* `client_id`
* `client_secret` (for confidential/server-side apps)
* one or more allowed redirect URIs

---

## 4) OAuth2 authorization code flow (with PKCE if you’re in the browser)

Wikimedia’s portal describes the basic authorization URL and token exchange. ([api.wikimedia.org][1])
The OAuth extension lists the supported parameters for `/oauth2/authorize` and `/oauth2/access_token` including `scope`, `state`, and PKCE fields. ([MediaWiki][2])

### 4.1 Build the authorize URL (GET)

**Server-side app (confidential client)** can do plain authorization code.
**Browser SPA / mobile / desktop (public client)** should use **PKCE** (recommended; and may be required depending on configuration). ([api.wikimedia.org][1])

```text
GET https://meta.wikimedia.org/w/rest.php/oauth2/authorize
  ?response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fyour.app%2Foauth%2Fcallback
  &scope=basic%20uploadfile
  &state=RANDOM_CSRF_STRING
  &code_challenge=BASE64URL_SHA256_OF_VERIFIER
  &code_challenge_method=S256
```

**Notes**

* `redirect_uri` (if included) must match what you registered. ([MediaWiki][2])
* `state` is critical to prevent login CSRF.
* PKCE uses `code_challenge` + later `code_verifier`. ([MediaWiki][2])

After login/consent, Wikimedia redirects to:

```text
https://your.app/oauth/callback?code=AUTH_CODE_HERE&state=...
```

### 4.2 Exchange code for tokens (POST)

POST to the token endpoint: ([api.wikimedia.org][1])

#### Confidential (server-side) example

```bash
curl -X POST \
  -d 'grant_type=authorization_code' \
  -d 'code=YOUR_AUTHORIZATION_CODE' \
  -d 'client_id=YOUR_CLIENT_ID' \
  -d 'client_secret=YOUR_CLIENT_SECRET' \
  -d 'redirect_uri=https://your.app/oauth/callback' \
  'https://meta.wikimedia.org/w/rest.php/oauth2/access_token'
```

#### Public (SPA/mobile) example (PKCE: no client_secret)

```bash
curl -X POST \
  -d 'grant_type=authorization_code' \
  -d 'code=YOUR_AUTHORIZATION_CODE' \
  -d 'client_id=YOUR_CLIENT_ID' \
  -d 'redirect_uri=https://your.app/oauth/callback' \
  -d 'code_verifier=THE_ORIGINAL_PKCE_VERIFIER' \
  'https://meta.wikimedia.org/w/rest.php/oauth2/access_token'
```

The response contains `access_token` and (for this flow) usually `refresh_token`. ([api.wikimedia.org][1])

---

## 5) CORS: make Commons API calls from a browser

This is the part people get wrong.

### Key rule: Action API CORS requires a query parameter

MediaWiki’s Action API requires **`origin=` or `crossorigin=`** in the URL for cross-site requests, including POSTs (and even the preflight context). ([MediaWiki][5])

### For authenticated requests using OAuth (Bearer token)

MediaWiki documents: use

* `crossorigin=` in the URL (no value needed), and
* `Authorization: Bearer …` header ([MediaWiki][5])

So your base endpoint becomes:

```text
https://commons.wikimedia.org/w/api.php?crossorigin=
```

### For unauthenticated reads

You can do `origin=*`, but that’s **logged-out only** and won’t carry auth. ([MediaWiki][5])

---

## 6) Upload flow to Commons (CSRF token → POST upload)

Even with OAuth, you still use a **CSRF token** for write actions like upload. The upload docs show this “get CSRF token → upload” flow. ([MediaWiki][3])

### 6.1 Get a CSRF token (GET)

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://commons.wikimedia.org/w/api.php?crossorigin=&action=query&meta=tokens&type=csrf&format=json"
```

You’ll get JSON containing:

```json
{
  "query": {
    "tokens": {
      "csrftoken": "...."
    }
  }
}
```

### 6.2 Upload the photo (POST multipart/form-data)

**Required-ish fields you’ll send**

* `action=upload`
* `filename=Something.jpg`
* `token=<CSRF token>`
* `file=@localfile.jpg`
* `format=json`

Common optional fields:

* `text=` (the initial File page wikitext) ([MediaWiki][3])
* `comment=` (upload comment; also used as initial page text if `text` omitted) ([MediaWiki][3])
* `ignorewarnings=1` (use carefully; better to handle warnings properly)

Example:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://commons.wikimedia.org/w/api.php?crossorigin=" \
  -F "action=upload" \
  -F "filename=My_Test_Photo_2025-12-21.jpg" \
  -F "token=YOUR_CSRF_TOKEN" \
  -F "format=json" \
  -F "ignorewarnings=0" \
  -F "comment=Upload via my app" \
  -F "text={{Information
|description={{en|1=Sunset at ...}}
|date=2025-12-21
|source={{own}}
|author=[[User:YOURUSERNAME|YOURUSERNAME]]
}}
{{self|cc-by-sa-4.0}}
[[Category:Sunsets]]
" \
  -F "file=@/path/to/photo.jpg"
```

**Important**: Commons will delete files that don’t have a legit license/source/author. Put proper wikitext in `text=`.

### Chunked upload (for large files)

MediaWiki supports uploading in chunks using `filesize`, `chunk`, and `offset` (and then finishing via `filekey`). ([MediaWiki][3])
If you’re uploading big images/videos from a browser, chunking is worth doing.

---

## 7) Browser (fetch) example with CORS done correctly

### 7.1 Get CSRF token with Bearer auth

```js
const API = "https://commons.wikimedia.org/w/api.php?crossorigin=";

async function getCsrfToken(accessToken) {
  const url = API + "&action=query&meta=tokens&type=csrf&format=json";
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const j = await r.json();
  return j?.query?.tokens?.csrftoken;
}
```

### 7.2 Upload with FormData

**Do not manually set `Content-Type`** when sending `FormData`—the browser must add the boundary.

```js
async function uploadToCommons(accessToken, file, filename, wikitext) {
  const csrf = await getCsrfToken(accessToken);

  const form = new FormData();
  form.append("action", "upload");
  form.append("format", "json");
  form.append("filename", filename);
  form.append("token", csrf);
  form.append("text", wikitext);
  form.append("ignorewarnings", "0"); // handle warnings instead of forcing
  form.append("file", file, file.name);

  const r = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  return await r.json();
}
```

This works because:

* Action API CORS is enabled by `crossorigin=` ([MediaWiki][5])
* OAuth auth is provided via `Authorization: Bearer …` ([MediaWiki][5])

---

## 8) A couple of “gotchas” that will save you hours

* **CORS**: if you forget `crossorigin=` (or `origin=`), the browser will block you even if the API itself is fine. ([MediaWiki][5])
* **Preflight**: because you use the `Authorization` header, browsers will preflight; the docs explicitly note the CORS parameter must be present for POSTs too. ([MediaWiki][5])
* **Filename collisions**: Commons is huge; collisions happen. Don’t blindly `ignorewarnings=1`. Handle the warning response and rename or dedupe.
* **Licensing**: Commons is not “file hosting”; metadata + license is mandatory.

---

If you tell me which architecture you’re building (pure browser SPA vs backend service), I can tailor the OAuth2 part (PKCE vs confidential client) and give you a clean “one function = one request” TypeScript uploader that also handles warnings + chunked uploads.

[1]: https://api.wikimedia.org/wiki/Authentication "Authentication - API Portal"
[2]: https://www.mediawiki.org/wiki/Extension%3AOAuth "Extension:OAuth - MediaWiki"
[3]: https://www.mediawiki.org/wiki/API%3AUpload "API:Upload - MediaWiki"
[4]: https://meta.wikimedia.org/wiki/Special%3AListGrants "Grants - Meta-Wiki"
[5]: https://www.mediawiki.org/wiki/Special%3AMyLanguage/API%3ACross-site_requests "API:Cross-site requests - MediaWiki"
