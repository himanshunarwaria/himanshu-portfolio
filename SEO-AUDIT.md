# Search and AI discovery audit

Audit date: 6 September 2026. Public identity: **Himanshu Narwaria**, as confirmed by the owner. Preferred origin: **https://www.himanshunarwaria.in**.

This report records the implementation and checks at the end of the local audit phase, before production deployment or search-engine submission. Deployment is verified separately. Local validation establishes technical consistency; it does not establish indexing, ranking, or inclusion in an AI answer.

## Findings and changes

| Area | Before | Implemented locally |
|---|---|---|
| Canonical host | All 61 indexable pages declared the non-www host, which redirects to www | Canonicals, Open Graph URLs, schema identifiers, and sitemap entries use the serving www host |
| Service information | Portfolio categories existed, but none of the six requested services had a dedicated service page | Six distinct pages with scope, process, brief requirements, FAQs, related services, and relevant work links |
| Personal identity | A homepage biography and scattered author references | A dedicated `about.html` profile; one shared Person identifier; official social links; linked article authors |
| Sharing images | 46 indexable pages lacked an Open Graph image | Every indexable page has a local, existing sharing image |
| Sharing cards | 41 indexable pages lacked Twitter/X card metadata | Complete card metadata added |
| Structured data | 14 indexable pages had no structured data | Descriptive page/work data added; Service and ProfilePage data supplied for the new pages |
| Broken article navigation | 12 links targeted the missing homepage `#blog` section | A visible design-notes section restores those destinations and links to articles |
| Internal discovery | The brand-case-study directory and its six case studies were unreachable through homepage links | Contextual links from the homepage and graphic-design service reconnect all seven pages |
| Sitemap | 61 entries used the redirecting host | 71 indexable canonical pages, including the subsequently synced AI Film portfolio and clips; all 5 existing noindex pages remain excluded |
| Homepage duplicate | `/index.html` returned HTTP 200 and relied on JavaScript to redirect | A permanent Vercel redirect is configured from `/index.html` to `/` |
| Crawl policy | Public crawling allowed, with an unnecessary image-directory restriction | Public pages and rendering assets allowed; sitemap points to the canonical host |
| Fresh-content notification | No IndexNow setup | Verification file and a submission script prepared; preview sends no requests |

These are individual technical findings, not a search-engine quality score. For example, one host mismatch affected both canonical and sitemap checks. Sharing cards and structured data help describe content; adding them is not a direct promise of higher rankings.

## Search intent and page map

The target phrases below describe the intended audience of each page. They are not search-volume estimates or measured positions.

| Page | Primary intent | Supporting evidence or content |
|---|---|---|
| `/` | Himanshu Narwaria; designer and developer | Identity, work, services, biography, contact |
| `/about.html` | Who is Himanshu Narwaria?; Himanshu Narwaria Agra | Focused profile, official social accounts, portfolio links |
| `/services.html` | Himanshu Narwaria services | Overview and links to all six services |
| `/graphic-design.html` | Graphic designer; graphic design in Agra; brand identity | Social, advertising, and Amazon design examples |
| `/video-editing.html` | Video editor; reels and YouTube editing | Specific edit scope, input requirements, production process |
| `/ai-video-production.html` | AI video creation; AI brand videos | Storyboards, generated scenes, finishing, feasibility and accuracy considerations |
| `/social-media-management.html` | Social media manager; content management in Agra | Scope of planning, design, scheduling, and reporting; related design work |
| `/web-design.html` | Web designer in Agra; responsive website design | Website UX and visual design, with existing case studies |
| `/web-development.html` | Web developer; frontend development services | Implementation, interactions, launch checks, and published case studies |

Web design and web development have different scopes and examples. The site also retains its existing Amazon listing, social design, and advertising collections. No duplicate location pages were created. The name “Himanshu Singh” is excluded following the owner's clarification.

## Live-site observations

Read-only HTTP checks established the following before deployment:

- The non-www HTTPS origin returns **308** to the www origin. The HTTP origin redirects to HTTPS.
- The www homepage, `robots.txt`, and `sitemap.xml` return **200**.
- All **61 previously indexable page URLs** returned **200**. One request timed out initially and succeeded on retry.
- `/index.html` currently returns **200**; the repository's new Vercel redirect still needs deployment.
- A deliberately nonexistent route returned a real **404**, rather than a soft-404 success response.
- Hosting response headers identify Vercel. The new configuration adds only the homepage redirect and preserves the existing route structure.

Search Console, Bing Webmaster Tools, field Core Web Vitals, analytics, backlink data, and verified search impressions were not available in this session. Public search-result sampling does not provide a reliable ranking baseline. An ordinary HTTP request succeeding also does not prove that every crawler IP can pass the hosting firewall.

## AI discovery approach

The new pages provide their substantive text and links in static HTML. A reader or crawler can identify the person, services, location, scope, related work, and contact options without executing JavaScript.

Google says its usual search requirements also apply to AI Overviews and AI Mode; it does not require a separate AI file or special AI schema. Crawlable content and clear internal links are the foundation, and eligibility still does not guarantee inclusion. [Google: AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).

OpenAI identifies **OAI-SearchBot** as the crawler for ChatGPT search. The wildcard robots policy allows it. Hosting/firewall access must also be checked after deployment. Search crawling and **GPTBot** training controls are separate; training access is not a ranking mechanism. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

The dedicated profile represents one person and uses ProfilePage with that person as its main entity. Service pages describe their actual visible offerings. [Google profile-page guidance](https://developers.google.com/search/docs/appearance/structured-data/profile-page).

The service FAQs are useful page content. They are not a claim of Google FAQ rich-result eligibility. Google limits those rich results primarily to authoritative government and health sites. [Google FAQ rich-result changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

## Publish and verify

1. **Deploy this reviewed repository to the existing Vercel project.** Include the new HTML, CSS, sitemap, robots file, `vercel.json`, and `indexnow-key.txt`. Keep the current www domain as the primary domain.
2. **Check the production responses.** The homepage and all eight new pages should return 200. `/index.html` should permanently redirect to `/`; a nonexistent URL should still return 404. Check canonical tags and the sitemap on production, rather than relying on the local files.
3. **Verify the domain in Google Search Console.** Use the real verification value supplied by the account, usually a DNS TXT record. No invented verification tag has been inserted. Submit `https://www.himanshunarwaria.in/sitemap.xml`, then inspect the homepage, profile, service hub, and service pages for indexing and rendered content.
4. **Verify/import the site in Bing Webmaster Tools.** Submit the same sitemap, inspect important URLs, and review indexing and crawl diagnostics. Bing also provides AI Performance reporting for citations in its supported experiences. [Bing Webmaster Tools setup](https://blogs.bing.com/webmaster/June-2025/Start-Using-Bing-Webmaster-Tools-to-Improve-Your-Site-Visibility), [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview).
5. **Notify IndexNow after deployment.** Run `node scripts/submit-indexnow.mjs` to preview, then `node scripts/submit-indexnow.mjs --submit`. The script verifies that the matching key and updated sitemap are publicly deployed before sending anything. Receipt means URLs were received, not that they rank or are indexed. [IndexNow protocol](https://www.indexnow.org/documentation).
6. **Validate representative structured data.** Check the production homepage, profile, a service page, a case study, and an article in Schema.org Validator and Google's Rich Results Test where the type is supported. The local audit checks JSON parsing and consistency, not every search-engine eligibility rule.

The homepage redirect follows [Vercel's redirect configuration](https://vercel.com/docs/routing/redirects). Google verification, Bing verification, and DNS changes require the relevant owner account; these were not performed during the audit.

## Content and authority work to continue

- Expand the synced AI Film portfolio with briefs, contributions, and short transcripts where useful; add supplied-footage editing examples as they become available. The AI service now links to the film portfolio and its separately labelled visual experiments. Add VideoObject only when the actual video, thumbnail, upload date, and playback information are available.
- Add specific, permission-backed case-study outcomes where you can substantiate them. Existing article claims about engagement, sales, or generic percentage improvements should be reviewed against their source material before being relied on as evidence.
- Keep the same professional name, website, location, and service descriptions on the official profiles you control. Request accurate attribution from clients when they feature your work.
- Collect genuine client feedback and publish it with permission and enough context to be useful.
- Develop articles around questions your actual prospects ask, supported by your work. Update substantive content when something changes; do not advance dates simply to appear fresh.

## Measurement

Record a baseline after the new pages are indexed, then compare consistent 28-day periods. Track branded and service queries separately, by landing page and country where useful.

- **Branded:** impressions, clicks, and query variants for Himanshu Narwaria.
- **Services:** impressions and clicks for each service page, qualified enquiries, and which pages attract relevant searches.
- **Technical:** indexed canonical URLs, crawl errors, duplicate URL reports, mobile usability, and field Core Web Vitals when sufficient data exists.
- **AI referrals and citations:** referral sources in analytics and Bing AI Performance where available. Manually sampled AI answers are variable and should not be treated as a stable rank tracker.

Review at roughly 30, 60, and 90 days for planning purposes, not as a promised ranking timetable. Visibility depends on relevance, evidence, competition, authority, location, and the search or AI system. A website edit cannot force a static LLM to learn new information or guarantee first place for broad names and global service queries.

## Maintenance and validation

Service copy lives in `content/services.json`; the shared identity and canonical origin live in `scripts/seo-config.mjs`. Generated pages are committed as ordinary static HTML. Edit those sources, then run:

```powershell
node scripts/build-seo-pages.mjs
node scripts/refresh-search-assets.mjs
node scripts/audit-seo.mjs --check --report artifacts/seo/after.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-portfolio.ps1
```

Update the content date in `scripts/seo-config.mjs` only after a substantive content change. The sitemap preserves the existing dates on older pages and includes canonical URLs and content dates.

Validation performed after syncing the AI Film portfolio: 76 HTML documents, 71 indexable sitemap URLs reachable through static links from the homepage, all 3,508 repository validation checks, and no findings from the local metadata/schema/anchor audit. Earlier browser validation covered 27 page/viewport checks across the homepage and eight new pages. The service directory also passed a JavaScript-disabled rendering check. Rebuilding the generated pages reproduced the reviewed HTML without changes. These checks do not replace production URL inspection or a field performance assessment.

Local evidence: `artifacts/seo/before.json`, `artifacts/seo/after.json`, `artifacts/seo/live-routes.json`, `artifacts/seo/browser-report.json`, and the screenshots in `artifacts/seo/`.
