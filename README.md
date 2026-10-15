# Samuel Godonu: portfolio website

Plain HTML, CSS, JavaScript and JSON. No build step, no Node, no npm.

```
index.html          home (hero, carousel, work, experience, skills, research, hackathons, gallery, about, contact)
summary.html        2-minute summary (print or save as PDF)
project.html        one page for every project (project.html?id=...)
404.html            not-found page
admin/              the dashboard (sign-in required)
css/  js/  data/  images/
js/config.js        Firebase + Cloudinary keys (empty until you add them)
firestore.rules     database security rules
netlify.toml        Netlify settings
```

## 1. Run it on your computer

1. Open the **folder that contains `index.html`** in VS Code (File > Open Folder).
2. Install the **Live Server** extension.
3. Right-click `index.html` > **Open with Live Server**.

Open the folder itself, not a parent folder, because the site loads files such as `/data/projects.json` from the root.

## 2. Edit your content without the dashboard

All content lives in `data/*.json`:

| File | What it controls |
|---|---|
| `settings.json` | name, headline, bio, story, email, social links, CV link |
| `slides.json` | carousel slides |
| `projects.json` | project cards and detail pages |
| `research.json` | research list (section hides itself when empty) |
| `hackathons.json`, `awards.json` | hackathons and certificates |
| `gallery.json` | gallery pictures |
| `timeline.json` | Education, Experience and Leadership tabs (`type` field) |
| `skills.json` | skills with a `level`: Learning, Working knowledge or Strong |

Put your pictures in `images/` and refer to them like `images/my-photo.jpg`. The four `slide-*.svg` files are placeholders: replace them.

Your CV: create a `files` folder, drop `cv.pdf` in it, and set `"resumeUrl": "files/cv.pdf"` in `settings.json`.

## 3. Deploy on Netlify

1. Push this folder to GitHub (`git add .`, `git commit -m "Portfolio"`, `git push`).
2. netlify.com > **Add new site > Import an existing project > GitHub** > pick the repo.
3. Build command: leave empty. Publish directory: `.`
4. **Deploy.** Every `git push` updates the live site.

**Contact form:** Netlify detects it automatically. In Netlify go to **Project configuration > Notifications > Form submission notifications** to get an email for every message. Messages are also listed under **Forms**.

## 4. Switch on the dashboard (Firebase + Cloudinary)

You can skip this and launch with JSON files first. When you want the dashboard:

### Firebase
1. console.firebase.google.com > **Add project**.
2. **Project settings > General > Your apps > Web (`</>`)**. Register the app and copy the `firebaseConfig` values into `js/config.js`.
3. **Build > Authentication > Get started > Email/Password > Enable.** Then **Users > Add user** and create your own email and password.
4. **Build > Firestore Database > Create database** (production mode, a region near you).
5. **Authentication > Settings > Authorized domains:** add your Netlify domain (for example `yoursite.netlify.app`).
6. Push to GitHub so the keys are live, then open `yoursite.netlify.app/admin/` and sign in.
7. On the **Overview** tab copy your **user ID**. Open `firestore.rules`, replace `PASTE_YOUR_ADMIN_UID_HERE` with it, and paste the whole file into **Firestore > Rules > Publish**.
8. On Overview press **Import starter content** once. From now on the site reads from the database, and every edit you make in the dashboard appears on the live site.

Firebase web keys are meant to be public. Your security comes from the rules in step 7, so do not skip it.

### Cloudinary (image uploads)
1. cloudinary.com > free account. Copy your **Cloud name**.
2. **Settings > Upload > Upload presets > Add upload preset.** Set **Signing mode: Unsigned**, save, copy the preset name.
3. Put both into `js/config.js` under `cloudinary`.

The free plan needs no card. Uploaded pictures are resized and compressed automatically by the site.

## 5. Before you announce it

- Add your portrait (Site settings > Portrait photo, or `"portrait"` in `settings.json`). The site is built around real photos, so this matters most.
- Replace the placeholder slides and gallery pictures.
- Check every skill level in `skills.json`. They are my starting guesses, not facts.
- Add a YouTube link to a project (`"video"`) and it appears as a click-to-play video on that project's page.
- Check that every statement about your projects is accurate. Dates for the hackathon and certificates are blank on purpose: fill them in.
- In `index.html` add an `og:image` meta tag with the full URL of a preview picture.
- Custom domain: Netlify > **Domain management > Add a domain**.

## Notes

- Phone number from your LinkedIn is deliberately not on the site.

## Where to add things

| I want to add… | Dashboard | Or edit this file |
|---|---|---|
| A new project, in any field | Projects > Add project. Type a new **Field or category** and a filter button appears on the site by itself | `data/projects.json` (copy a block, change the `"category"`) |
| A field I have not started yet | Site settings > **Upcoming project fields** | `"upcoming"` in `data/settings.json` (shown as "soon" chips under Work) |
| Gallery pictures | Gallery > Add picture. Pick the album (Lab, Designs, Events or a new one) and give every picture a title | `data/gallery.json` (one block per picture) |
| A hackathon | Hackathons > Add hackathon (picture goes inside the card) | `data/hackathons.json` |
| A certificate or award | Certificates > Add certificate or award | `data/awards.json` |
| Research | Research > Add research item. "Coming soon" disappears once you add one | `data/research.json` |