# Admin System for Blog Post Management

**Decision Document** for implementing an admin interface to add/edit posts without manual JSON editing.

---

## Current State

- Posts stored as **JSON files** in `src/data/YYYY.json` (organized by year)
- Manual workflow:
  1. Edit JSON file
  2. Run `npm run dev` or `npm run build`
  3. Commit and push to GitHub
  4. Cloudflare Pages rebuilds the site
- **No admin UI** — all changes require code edits

---

## Goal

Implement a system where:
1. **One admin user** can log in (authentication)
2. **Add/edit posts** via a web UI (no JSON editing)
3. **Posts persist** in some backend storage
4. **Site automatically rebuilds** (or updates) when posts change
5. **Mobile-friendly** admin dashboard (nice to have)

---

## Five Implementation Options

### **Option A: Headless CMS** (Contentful, Supabase, Strapi, etc.)

Use a hosted CMS service that provides a built-in admin UI and API.

#### Examples:
- **Contentful** — Expensive ($489+/month), powerful, enterprise features
- **Supabase** — PostgreSQL + auth + real-time APIs, ~$25/month or free tier
- **Strapi** — Self-hosted or managed, flexible, ~$399/month hosted
- **Sanity.io** — Headless CMS, $99+/month
- **Decap CMS** — Free, Git-based, simple UI (GitHub stored)

#### Pros:
✅ **Hosted service** — No server to manage  
✅ **Beautiful admin UI** — Built-in and customizable  
✅ **Authentication included** — User management out of box  
✅ **Content versioning** — History and rollback  
✅ **No custom backend code** — Just connect API to your Astro site  

#### Cons:
❌ **Vendor lock-in** — Data lives on someone else's servers  
❌ **Cost** — Can range from free (Decap) to $500+/month  
❌ **API latency** — Fetching content at build/render time  
❌ **Learning curve** — Each CMS has its own UI/config  

#### Architecture:
```
Admin Login via CMS → Edit Post → API Call → CMS Database
                                   ↓
                         GitHub commit trigger (Decap)
                                   ↓
                         Cloudflare Pages rebuild
                                   ↓
                         Astro fetches from CMS or JSON
                                   ↓
                         Static site generated
```

#### Quick Start (Supabase Example):
1. Create Supabase project (free tier available)
2. Create `posts` table with columns: `id`, `title`, `slug`, `date`, `content`, `categories`
3. Add Supabase auth UI for admin login
4. Build admin dashboard page in Astro
5. On post save, trigger rebuild via GitHub API or webhook
6. Astro fetches posts from Supabase at build time

#### Cost:
- **Supabase free tier**: $0 (up to 500 MB, 1 auth user)
- **Contentful**: $489/month
- **Strapi**: $399/month (managed) or $0 (self-hosted, but requires server)
- **Decap CMS**: $0 (uses GitHub, no servers)

#### Best For:
- Quick launch (prefer not building backend)
- Non-technical admin users (visual UI)
- Multiple admins (CMS handles permissions)
- Small budget (Supabase free tier or Decap)

---

### **Option B: Cloudflare Workers + KV Storage**

Leverage your existing Cloudflare Pages setup. Build a minimal backend using Cloudflare Workers (serverless functions) and KV (key-value database).

#### Pros:
✅ **Already using Cloudflare** — Tight integration  
✅ **Serverless** — No server management  
✅ **Free tier generous** — 100,000 requests/day free  
✅ **Very fast** — Global edge locations  
✅ **Simple auth** — Can use Cloudflare Access or custom JWT  
✅ **No new vendor** — All in one place  

#### Cons:
❌ **Requires coding** — More implementation work  
❌ **KV eventual consistency** — Not instantly consistent  
❌ **Need to build admin UI** — No CMS UI provided  
❌ **Learning curve** — Cloudflare Workers API unfamiliar  
❌ **Single user auth** — Custom implementation  

#### Architecture:
```
Browser → Cloudflare Pages (admin UI in Astro)
            ↓
         POST /api/posts (authenticated)
            ↓
         Cloudflare Worker validates JWT
            ↓
         Saves to Cloudflare KV
            ↓
         Triggers webhook → GitHub commit (or direct)
            ↓
         Cloudflare Pages rebuilds
            ↓
         Astro reads from `/data/` or KV at build time
```

#### Quick Start:
1. Create a Cloudflare Worker for `/api/posts` endpoint
2. Implement simple JWT auth (or Cloudflare Access)
3. Save posts to KV storage
4. Build admin form in Astro page
5. On save, trigger rebuild via GitHub API webhook
6. At build time, fetch posts from KV and write to `src/data/`

#### Example Worker Code:
```javascript
// API route to save post
export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (token !== env.ADMIN_TOKEN) return new Response('Unauthorized', { status: 401 });

      const post = await request.json();
      await env.POSTS_KV.put(`posts:${post.slug}`, JSON.stringify(post));
      
      // Trigger rebuild
      await fetch('https://api.github.com/repos/...', { /* webhook */ });
      
      return new Response(JSON.stringify({ ok: true }));
    }
  }
};
```

#### Cost:
- **Free tier**: 100,000 requests/day, 1 GB KV storage
- **Paid**: $0.50/million requests, $0.50/million KV operations
- **Cloudflare Pages**: Free (included)
- **Total for 1 admin user**: $0–5/month

#### Best For:
- Already using Cloudflare
- Want tight integration
- Don't mind writing backend code
- Small team or solo admin
- Prefer no new vendors

---

### **Option C: Express.js + PostgreSQL/SQLite**

Traditional Node.js backend. Host it on Vercel, Railway, Fly.io, or self-hosted VPS.

#### Pros:
✅ **Full control** — Do anything you want  
✅ **Familiar tech** — Node.js, express, standard web dev  
✅ **Battle-tested** — Millions of sites use this stack  
✅ **Rich ecosystem** — Tons of libraries (auth, ORM, validation)  
✅ **Easy to debug** — Standard HTTP/SQL  
✅ **Multiple databases** — SQLite, PostgreSQL, MySQL  

#### Cons:
❌ **More infrastructure** — Need to host + maintain server  
❌ **More code to write** — API + database setup + admin UI  
❌ **Cost** — $5–25+/month depending on host  
❌ **Complexity** — More moving parts (server, DB, migrations)  

#### Architecture:
```
Browser → Express.js API (auth, post CRUD)
            ↓
         POST /api/posts
            ↓
         Express validates auth
            ↓
         Save to PostgreSQL/SQLite
            ↓
         Trigger webhook → GitHub commit
            ↓
         Cloudflare Pages rebuilds
            ↓
         Astro fetches posts from API or JSON
```

#### Quick Start:
1. Create Express server (can use existing Node.js setup)
2. Set up PostgreSQL or SQLite database
3. Create `/api/posts` routes (GET, POST, PUT, DELETE)
4. Implement JWT or session auth for admin user
5. Build admin form in separate React/Vue app or Astro page
6. On save, write to JSON files + commit to GitHub
7. Rebuild site

#### Example Code (Express + SQLite):
```javascript
import express from 'express';
import Database from 'better-sqlite3';

const app = express();
const db = new Database('posts.db');
const ADMIN_PASSWORD = 'your-secret-password';

app.post('/api/posts', (req, res) => {
  const { post, password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Unauthorized' });
  
  const stmt = db.prepare('INSERT INTO posts (slug, title, date, content) VALUES (?, ?, ?, ?)');
  stmt.run(post.slug, post.title, post.date, post.content);
  
  // Trigger GitHub API to commit
  // Then rebuild Cloudflare Pages
  
  res.json({ ok: true });
});

app.listen(3000);
```

#### Hosting Options:
- **Vercel**: $20/month (free tier available)
- **Railway**: $5/month starter
- **Fly.io**: $3/month minimum
- **Heroku**: $7/month (no free tier as of 2023)
- **Self-hosted VPS**: $5–10/month (DigitalOcean, Linode)

#### Best For:
- Want maximum control
- Comfortable with traditional backend
- Plan complex business logic later
- Don't want Cloudflare lock-in
- Team of developers

---

### **Option D: GitHub-as-CMS**

Use GitHub as the database. Admin user commits files via GitHub API. No separate backend.

#### Pros:
✅ **No backend server** — GitHub hosts everything  
✅ **Free** — GitHub API included  
✅ **Version control built-in** — Every edit is a commit  
✅ **Audit trail** — Git history is immutable  
✅ **Simple** — Minimal architecture  
✅ **GitHub integration natural** — Already using GitHub  

#### Cons:
❌ **Slower commits** — API call + GitHub + rebuild = seconds  
❌ **Rate limits** — GitHub API has limits  
❌ **Awkward workflow** — Commit messages required  
❌ **No transactional safety** — Merge conflicts possible  
❌ **Simple UI only** — UI less polished than CMS  
❌ **Rebuild latency** — Waits for Cloudflare Pages build  

#### Architecture:
```
Browser → Admin Form (Astro page)
            ↓
         Validate password
            ↓
         POST file via GitHub API
            ↓
         Create commit
            ↓
         GitHub webhook → Cloudflare Pages rebuild
            ↓
         Astro reads from `/src/data/`
            ↓
         Static site generated
```

#### Quick Start:
1. Build admin form in Astro (protected by password)
2. Use `@octokit/rest` to talk to GitHub API
3. Fetch current year JSON file
4. Add new post object to array
5. Commit updated file via API
6. Cloudflare Pages rebuilds automatically (webhook)

#### Example Code (Using Octokit):
```javascript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function addPost(post) {
  const year = new Date(post.date).getFullYear();
  const path = `src/data/${year}.json`;
  
  // Get current file
  const { data } = await octokit.repos.getContent({
    owner: 'your-username',
    repo: 'imiasum.ro',
    path,
  });
  
  // Update content
  const posts = JSON.parse(atob(data.content));
  posts.push(post);
  
  // Commit back
  await octokit.repos.createOrUpdateFileContents({
    owner: 'your-username',
    repo: 'imiasum.ro',
    path,
    message: `Add post: ${post.title}`,
    content: Buffer.from(JSON.stringify(posts, null, 2)).toString('base64'),
    sha: data.sha,
  });
}
```

#### Cost:
- **Free** (GitHub API free for personal use)
- **Cloudflare Pages**: Free

#### Best For:
- Developer users comfortable with Git
- No budget
- Minimal infrastructure
- Simple content (blog posts only)
- Audit trail important

---

### **Option E: Minimal Custom API (File-Based Backend)**

Build a lightweight Node.js server that saves posts directly to JSON files. Deploy to your own server or Vercel/Railway.

#### Pros:
✅ **Simple architecture** — Just HTTP + JSON files  
✅ **Direct file editing** — Posts written to `src/data/` immediately  
✅ **Minimal dependencies** — Few npm packages  
✅ **Free or cheap** — Can run on free tier  
✅ **Good for learning** — Educational, not complex  
✅ **No database** — JSON files in repo  

#### Cons:
❌ **Concurrency issues** — Multiple admins = conflicts  
❌ **No transactions** — No atomicity guarantee  
❌ **Manual build trigger** — Need to call rebuild API  
❌ **Basic auth only** — Password-based, not JWT  
❌ **Single user only** — Not built for scale  

#### Architecture:
```
Browser → Node.js API Server (simple auth + file write)
            ↓
         POST /posts
            ↓
         Validate password
            ↓
         Write to JSON file in src/data/
            ↓
         Trigger rebuild webhook
            ↓
         Cloudflare Pages rebuilds
```

#### Quick Start:
1. Create simple Express server
2. Implement `/api/posts` POST endpoint (password-based)
3. On post save, write to `src/data/YYYY.json`
4. Trigger GitHub commit or Cloudflare Pages rebuild
5. Done

#### Example Code:
```javascript
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const ADMIN_PASSWORD = 'your-secret';

app.post('/api/posts', express.json(), async (req, res) => {
  const { post, password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const year = new Date(post.date).getFullYear();
  const filePath = path.join(process.cwd(), `src/data/${year}.json`);
  
  try {
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    data.push(post);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    // Trigger rebuild
    await fetch('https://api.github.com/...', { /* rebuild webhook */ });
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000);
```

#### Cost:
- **Vercel free tier**: $0 (limited)
- **Railway free tier**: $0 (limited)
- **Self-hosted**: $5–10/month

#### Best For:
- Solo admin user
- Learning exercise
- Proof-of-concept
- Simple requirements
- Don't want external services

---

## Comparison Table

| Criteria | **A: Headless CMS** | **B: Cloudflare Workers** | **C: Express + DB** | **D: GitHub API** | **E: File-Based** |
|----------|---|---|---|---|---|
| **Setup time** | 30 min | 2–4 hours | 3–6 hours | 2–3 hours | 1–2 hours |
| **Monthly cost** | $0–500 | $0–5 | $5–25 | $0 | $0–5 |
| **Vendor lock-in** | High | Medium (Cloudflare) | Low | None | Low |
| **Need database** | No | No | Yes (SQLite or DB) | No | No |
| **Build backend** | No | Yes | Yes | Light | Yes (light) |
| **Admin UI** | Built-in | Build custom | Build custom | Build custom | Build custom |
| **Single user support** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Multi-user support** | ✅ (varies) | ❌ (needs work) | ✅ | ❌ (needs work) | ❌ |
| **Authentication** | Built-in | Custom JWT | Custom (session/JWT) | Password or OAuth | Password |
| **Scalability** | ✅ | ✅ | ✅ | Medium | ❌ |
| **Learning curve** | Medium | Medium–High | Low–Medium | Low | Very Low |
| **Recommended for** | Non-tech, quick launch | Cloudflare user, serverless | Traditional dev | Developers, free | Solo admin, learning |

---

## Recommended Next Steps

1. **Choose one option** based on:
   - How much you want to spend
   - Technical comfort level
   - Existing infrastructure (Cloudflare, GitHub, etc.)

2. **Create a spike** (1–2 day prototype) of chosen option

3. **Build admin form** (HTML form or React component)

4. **Implement authentication** (password, GitHub OAuth, or JWT)

5. **Test post creation** end-to-end

6. **Deploy to production**

---

## Recommendation for This Project

**Best overall fit: Option B (Cloudflare Workers + KV)** or **Option A (Supabase with free tier)**

**Why Option B (Cloudflare Workers)?**
- Already using Cloudflare Pages for hosting
- Free tier is generous ($0/month for small traffic)
- Single admin user fits Workers auth patterns
- Tight integration with your existing stack
- No new vendors to learn

**Why Option A (Supabase)?** (alternative)
- If you want a CMS UI without building one
- Free tier supports 1 admin user
- PostgreSQL is standard, familiar
- Less code to write

**Not recommended:**
- **Option C**: Overkill for one admin adding posts
- **Option D**: Too slow for real-time feedback
- **Option E**: Fragile for production use

---

## Questions to Ask Yourself

1. **How often will posts be added?** (Weekly? Daily? Rarely?)
   - Rare → Simple solution (GitHub API or file-based)
   - Regular → Polished solution (CMS or Workers)

2. **Do you have budget for services?**
   - No → GitHub API, Cloudflare Workers, or self-host
   - Yes → Supabase free tier or paid CMS

3. **Do you want to learn backend coding?**
   - No → Use headless CMS (Option A)
   - Yes → Build Express API (Option C) or Workers (Option B)

4. **How important is rebuild speed?**
   - Fast feedback → Cloudflare Workers or direct file write
   - Slow OK → GitHub API or CMS (will be seconds)

---

## See Also

- `README.md` — "Adding a New Post" (current manual workflow)
- `todo.md` — Admin system linked as decision item
- `astro.config.mjs` — Current Astro + Cloudflare Pages config
- `package.json` — Current dependencies


