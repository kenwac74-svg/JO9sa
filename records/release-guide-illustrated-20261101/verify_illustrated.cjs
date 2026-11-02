'use strict';

// Run after build_illustrated.py. This verifier writes only its new QA report,
// illustrated previews, and the dedicated browser temporary directory below.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const {pathToFileURL} = require('url');
const {chromium} = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const ROOT = __dirname;
const GAME = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const TEMPORARY = 'G:/Codex/tmp/release-guide-illustrated-preview-20261101';
const REPORT = path.join(ROOT, 'verification-illustrated.json');
const EXPECTED_KEYS = [
  ['ogre'],
  ['cat_execute', 'cat_spare', 'col_death', 'col_survive'],
  ['col_victory'],
  ['isabella', 'egeya'],
  ['group'],
];
const QSP = [path.join(GAME, 'jack.qsp'), 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'];
const LOCALES = {
  ko: {data: 'content.json', forum: 'JO9_2.4.1_Forum_KO.txt', expand: '전체 펼치기', collapse: '전체 접기', otherHeading: '[3. 그외 변경]'},
  en: {data: 'content.en.json', forum: 'JO9_2.4.1_Forum_EN.txt', expand: 'Expand all', collapse: 'Collapse all', otherHeading: '[3. OTHER CHANGES]'},
};
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const hash = filename => sha(fs.readFileSync(filename));
const readJSON = filename => JSON.parse(fs.readFileSync(filename, 'utf8').replace(/^\uFEFF/, ''));
const samePath = (one, two) => path.resolve(one).toLowerCase() === path.resolve(two).toLowerCase();
let checks = 0;
function check(value, message) { checks++; assert.ok(value, message); }
function equal(actual, expected, message) { checks++; assert.deepEqual(actual, expected, message); }
function fields(data) {
  return [
    ...data.features241.flatMap(row => [row.title, row.body, ...(row.items || [])]),
    ...data.followups241,
    ...['groups240', 'fixes'].flatMap(section => data[section].flatMap(row => [row.title, ...row.items])),
    ...data.other,
  ];
}
function countLiteral(text, value) { return text.split(value).length - 1; }
function checkHashes(expected, label) {
  for (const [filename, digest] of Object.entries(expected)) equal(hash(filename), digest, `${label}: ${filename}`);
}
function verifyCleanupScope(directory) {
  const absolute = path.resolve(directory);
  equal(absolute.toLowerCase(), path.resolve(TEMPORARY).toLowerCase(), 'Cleanup stays in the dedicated browser directory');
  check(!fs.lstatSync(absolute).isSymbolicLink(), 'Browser temporary root is not a link or junction');
  const realRoot = fs.realpathSync(absolute);
  function visit(current) {
    const stat = fs.lstatSync(current);
    check(!stat.isSymbolicLink(), 'Cleanup does not traverse a link or junction');
    const relative = path.relative(realRoot, fs.realpathSync(current));
    check(relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)), 'Cleanup target resolves inside the temporary root');
    if (stat.isDirectory()) for (const child of fs.readdirSync(current)) visit(path.join(current, child));
  }
  visit(absolute);
  return absolute;
}
async function decodeImages(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode(); }));
  });
}
async function noOverflow(page, label) {
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ': page has no horizontal overflow');
  const bad = await page.locator('.hero-art, .feature, .feature-media, .feature-media figure, img, nav, #expand240').evaluateAll(nodes => nodes.filter(node => {
    const box = node.getBoundingClientRect();
    return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1);
  }).map(node => ({tag: node.tagName, class: node.className, key: node.getAttribute('data-image-key')})));
  equal(bad, [], label + ': artwork and controls stay within the viewport');
}
async function checkExpand(page, words, label) {
  const button = page.locator('#expand240');
  equal(await button.innerText(), words.expand, label + ': localized collapsed button');
  equal(await button.getAttribute('aria-controls'), 'changes240', label + ': expand button controls the cumulative list');
  equal(await button.getAttribute('aria-expanded'), 'false', label + ': initial accessible collapsed state');
  await button.click();
  await page.waitForFunction(() => document.querySelectorAll('#changes240 details[open]').length === 7 && document.querySelector('#expand240').getAttribute('aria-expanded') === 'true');
  equal(await button.innerText(), words.collapse, label + ': localized expanded button');
  await noOverflow(page, label + ' expanded');
  await button.click();
  await page.waitForFunction(() => document.querySelectorAll('#changes240 details[open]').length === 0 && document.querySelector('#expand240').getAttribute('aria-expanded') === 'false');
  equal(await button.innerText(), words.expand, label + ': collapse all restores the button');
  const first = page.locator('#changes240 summary').first();
  await first.focus();
  await page.keyboard.press('Enter');
  equal(await page.locator('#changes240 details[open]').count(), 1, label + ': keyboard opens a single cumulative category');
  await first.press('Enter');
  equal(await page.locator('#changes240 details[open]').count(), 0, label + ': keyboard closes a single cumulative category');
}
async function checkNavigation(page, label) {
  equal(await page.locator('nav a').count(), 3, label + ': three document sections');
  const hrefs = await page.locator('nav a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  equal(hrefs, ['#updates', '#fixes', '#others'], label + ': document section links retained');
  for (const href of hrefs) {
    await page.locator(`nav a[href="${href}"]`).click();
    equal(new URL(page.url()).hash, href, label + ': navigation reaches ' + href);
    const position = await page.locator(href).evaluate(node => {
      const top = node.getBoundingClientRect().top;
      const documentTop = top + scrollY;
      const maximumScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      return {top, expectedTop: documentTop - Math.min(Math.max(0, documentTop - 78), maximumScroll)};
    });
    check(Math.abs(position.top - position.expectedTop) < 8, label + ': navigation scrolls to ' + href + ' with the sticky-header offset or page-bottom limit');
  }
}

async function main() {
  const started = new Date().toISOString();
  const result = {pass: false, started, checks: 0, languages: [], source_counts: {highlights: 5, followups: 2, cumulative_groups: 7, cumulative_items: 48, bugfix_items: 36, other_items: 11}};
  let browser, createdTemporary = false, failure;
  try {
    const build = readJSON(path.join(ROOT, 'illustrated-build-report.json'));
    equal(build.total_images_per_language, 10, 'Build declares ten images per language');
    equal(build.files.map(row => row.locale).sort(), ['en', 'ko'], 'Build contains exactly Korean and English HTML');
    check(build.protected_hashes && Object.keys(build.protected_hashes).length >= 7, 'Build includes protected manuscript, forum, and QSP hashes');
    for (const filename of [...QSP, ...Object.values(LOCALES).map(row => path.join(ROOT, row.forum)), path.join(ROOT, 'content.json'), path.join(ROOT, 'content.en.groups.json'), path.join(ROOT, 'content.en.fixes.json')]) {
      check(Object.keys(build.protected_hashes).some(candidate => samePath(candidate, filename)), 'Protected build hashes cover ' + filename);
    }
    checkHashes(build.protected_hashes, 'Protected source unchanged since the illustrated build');
    const before = Object.fromEntries(Object.keys(build.protected_hashes).map(filename => [filename, hash(filename)]));
    const manuscripts = {};
    for (const [locale, words] of Object.entries(LOCALES)) {
      const data = readJSON(path.join(ROOT, words.data));
      manuscripts[locale] = data;
      equal(fields(data).length, 122, locale + ': all 122 manuscript fields retained');
      equal(data.features241.length, 5, locale + ': five highlight descriptions');
      equal(data.followups241.length, 2, locale + ': two follow-up descriptions');
      equal(data.groups240.length, 7, locale + ': seven cumulative groups');
      equal(data.groups240.reduce((n, row) => n + row.items.length, 0), 48, locale + ': 48 cumulative entries');
      equal(data.fixes.reduce((n, row) => n + row.items.length, 0), 36, locale + ': 36 grouped bugfix entries');
      equal(data.other.length, 11, locale + ': eleven other entries');
      const raw = fs.readFileSync(path.join(ROOT, words.forum));
      const text = raw.toString('utf8').replace(/^\uFEFF/, '');
      check(raw.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), locale + ': forum retains UTF-8 BOM');
      check(!/(?<!\r)\n|\r(?!\n)/.test(text), locale + ': forum retains consistent CRLF');
      check(!/<[A-Za-z!/][^>]*>|data:image|file:\/\/\/|127\.0\.0\.1|[CG]:[\\/]/.test(text), locale + ': forum stays plain text without paths');
      for (const item of fields(data)) equal(countLiteral(text, item), 1, locale + ': forum contains each manuscript field once: ' + item.slice(0, 65));
      check(text.indexOf(data.other[0]) > text.indexOf(words.otherHeading) && text.includes(words.otherHeading), locale + ': in-development Agrabah inventory stays under Other changes');
      check(locale === 'en' ? /Agrabah special inventory \(in development\)/.test(data.other[0]) : /아그라바/.test(data.other[0]) && /개발 중/.test(data.other[0]), locale + ': Agrabah development label retained');
      if (locale === 'en') check(!text.includes('when their turn begins'), 'English equipment wording does not become a per-turn claim');
    }
    for (const section of ['features241', 'followups241', 'groups240', 'fixes', 'other']) equal(manuscripts.ko[section].length, manuscripts.en[section].length, 'Korean/English section parity: ' + section);
    for (const section of ['groups240', 'fixes']) equal(manuscripts.ko[section].map(row => row.items.length), manuscripts.en[section].map(row => row.items.length), 'Korean/English item parity: ' + section);

    check(!fs.existsSync(TEMPORARY), 'Dedicated browser temporary directory must be new');
    fs.mkdirSync(TEMPORARY, {recursive: true});
    createdTemporary = true;
    browser = await chromium.launch({executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, env: {...process.env, TMP: TEMPORARY, TEMP: TEMPORARY}});
    for (const row of build.files) {
      const {locale} = row, words = LOCALES[locale], data = manuscripts[locale];
      const filename = path.resolve(row.file), raw = fs.readFileSync(filename), html = raw.toString('utf8');
      check(path.dirname(filename).toLowerCase() === path.resolve(ROOT).toLowerCase(), locale + ': HTML is in the guide output directory');
      equal(raw.length, row.bytes, locale + ': HTML byte count matches illustrated build');
      equal(sha(raw), row.sha256, locale + ': HTML hash matches illustrated build');
      check(raw.length < 800 * 1024, locale + ': self-contained HTML below 800 KiB');
      check(!/(?:src|href)\s*=\s*["'](?:https?:|\/\/|file:)/i.test(html), locale + ': no external or absolute file resource references');
      check(!/(?:G:[\\/]|C:[\\/]|127\.0\.0\.1|JO9sa[\\/]|jo9_cruel_mercy)/i.test(html), locale + ': no private paths, local server, or hidden variable identifiers');
      check(!/<(?:iframe|object|embed|form)\b/i.test(html), locale + ': no embedded executable documents or forms');
      equal(row.images.length, 10, locale + ': ten image provenance records');
      equal(row.images.map(image => image.key).sort(), ['city', ...EXPECTED_KEYS.flat()].sort(), locale + ': ten expected asset keys');
      for (const image of row.images) {
        const source = path.resolve(GAME, image.source);
        check(source.toLowerCase().startsWith(path.resolve(GAME).toLowerCase() + path.sep), locale + ': illustration provenance is inside the game resource directory');
        equal(hash(source), image.source_sha256, locale + ': original image unchanged: ' + image.key);
        const limit = image.key === 'city' ? 640 : 560;
        check(image.width > 0 && image.height > 0 && image.width <= limit && image.height <= limit, locale + ': source dimensions bounded: ' + image.key);
      }
      const context = await browser.newContext({viewport: {width: 1280, height: 1000}, deviceScaleFactor: 1, offline: true});
      const page = await context.newPage(), errors = [], network = [], requests = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('request', request => { if (!['file:', 'data:'].includes(new URL(request.url()).protocol)) requests.push(request.url()); });
      await page.route(/^https?:/i, route => { network.push(route.request().url()); return route.abort(); });
      await page.emulateMedia({reducedMotion: 'reduce'});
      await page.goto(pathToFileURL(filename).href, {waitUntil: 'load'});
      await decodeImages(page);
      equal(await page.locator('html').getAttribute('lang'), locale, locale + ': document language');
      equal(await page.locator('img').count(), 10, locale + ': ten images decode offline');
      equal(await page.locator('.hero-art img').count(), 1, locale + ': one introduction image');
      equal(await page.locator('figure[data-image-key]').count(), 9, locale + ': nine keyed explanation figures');
      equal(await page.locator('.feature-grid > .feature').count(), 5, locale + ': five feature cards');
      for (let index = 0; index < EXPECTED_KEYS.length; index++) {
        const feature = page.locator('.feature-grid > .feature').nth(index);
        equal(await feature.locator('figure[data-image-key]').evaluateAll(nodes => nodes.map(node => node.dataset.imageKey)), EXPECTED_KEYS[index], locale + ': correct image keys beside feature ' + (index + 1));
        check((await feature.locator('.feature-copy').textContent()).includes(data.features241[index].title), locale + ': image group stays beside its manuscript title ' + (index + 1));
      }
      const images = await page.locator('img').evaluateAll(nodes => nodes.map(node => ({
        key: node.closest('figure').dataset.imageKey || 'city', src: node.src, width: node.naturalWidth, height: node.naturalHeight,
        width_attribute: Number(node.getAttribute('width')), height_attribute: Number(node.getAttribute('height')), alt: node.alt,
      })));
      for (const image of images) {
        const provenance = row.images.find(asset => asset.key === image.key);
        check(image.src.startsWith('data:image/webp;base64,'), locale + ': WebP embedded: ' + image.key);
        equal(Buffer.from(image.src.split(',')[1], 'base64').length, provenance.embedded_bytes, locale + ': embedded bytes agree with provenance: ' + image.key);
        equal([image.width, image.height], [provenance.width, provenance.height], locale + ': decoded dimensions agree with provenance: ' + image.key);
        equal([image.width_attribute, image.height_attribute], [image.width, image.height], locale + ': image reserves its natural aspect ratio: ' + image.key);
        check(image.alt.length > 8, locale + ': descriptive image alt text: ' + image.key);
        if (image.key !== 'city') {
          const expectedCaption = provenance['caption_' + locale];
          equal(image.alt, expectedCaption, locale + ': corresponding translated alt: ' + image.key);
          equal(await page.locator(`figure[data-image-key="${image.key}"] figcaption`).innerText(), expectedCaption, locale + ': corresponding translated caption: ' + image.key);
        }
      }
      const bodyText = await page.locator('body').textContent();
      for (const item of fields(data)) check(bodyText.includes(item), locale + ': HTML includes manuscript field: ' + item.slice(0, 65));
      equal(await page.locator('#changes240 details').count(), 7, locale + ': seven cumulative categories in HTML');
      equal(await page.locator('#changes240 li').count(), 48, locale + ': 48 cumulative entries in HTML');
      equal(await page.locator('#fixes li').count(), 36, locale + ': 36 bugfix entries in HTML');
      equal(await page.locator('.other-list li').count(), 11, locale + ': eleven other entries in HTML');
      const featuresText = await page.locator('.feature-grid').innerText();
      check(!/Agrabah|Fresh Fruit|Agrabah Wine|아그라바/.test(featuresText), locale + ': unfinished Agrabah inventory remains outside highlights');
      check((await page.locator('.other-list').innerText()).includes(data.other[0]), locale + ': Agrabah development entry remains in Other changes');
      if (locale === 'en') {
        check(!/[가-힣]/.test(bodyText.replaceAll('콤콤삼촌', '')), 'English visible manuscript and captions are translated except original credit handle');
        check(bodyText.includes('English guide to the Korean mod'), 'English guide identifies the Korean game client');
      }
      const links = await page.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
      for (const href of links) {
        check(typeof href === 'string' && href.startsWith('#') && href.length > 1, locale + ': links stay inside the single file');
        equal(await page.locator(href).count(), 1, locale + ': internal anchor resolves: ' + href);
      }
      await noOverflow(page, locale + ' desktop 1280');
      const previews = {};
      previews.desktop = path.join(ROOT, `preview-illustrated-${locale}-desktop.png`);
      await page.screenshot({path: previews.desktop});
      // The four-outcome feature is representative and keeps previews bounded.
      previews.features = path.join(ROOT, `preview-illustrated-${locale}-features.png`);
      await page.locator('.feature-grid > .feature').nth(1).screenshot({path: previews.features});
      await checkExpand(page, words, locale + ' desktop');
      await checkNavigation(page, locale + ' desktop');
      const mobile = [];
      for (const width of [390, 360]) {
        await page.setViewportSize({width, height: 844});
        await page.goto(pathToFileURL(filename).href, {waitUntil: 'load'});
        await decodeImages(page);
        await noOverflow(page, locale + ' mobile ' + width);
        if (width === 390) {
          previews.mobile = path.join(ROOT, `preview-illustrated-${locale}-mobile.png`);
          await page.screenshot({path: previews.mobile});
        }
        await checkExpand(page, words, locale + ' mobile ' + width);
        await checkNavigation(page, locale + ' mobile ' + width);
        mobile.push(width);
      }
      equal(errors, [], locale + ': no browser JavaScript errors');
      equal(network, [], locale + ': no HTTP or HTTPS requests');
      equal(requests, [], locale + ': no external requests of any protocol');
      result.languages.push({locale, file: filename, html_bytes: raw.length, html_sha256: sha(raw), manuscript_fields: fields(data).length,
        forum_sha256: hash(path.join(ROOT, words.forum)), images: images.map(({src, width_attribute, height_attribute, ...image}) => image), desktop: 1280, mobile,
        http_requests: network, external_requests: requests, page_errors: errors, previews});
      await context.close();
    }
    checkHashes(before, 'Protected source unchanged during verification');
    for (const row of build.files) for (const image of row.images) equal(hash(path.resolve(GAME, image.source)), image.source_sha256, 'Original image unchanged after verification: ' + image.key);
    Object.assign(result, {pass: true, qsp_unchanged: true, source_images_unchanged: true, protected_files_unchanged: true, forum_texts_unchanged: true});
  } catch (error) {
    failure = error;
    result.error = String(error.stack || error);
  } finally {
    try {
      if (browser) await browser.close();
      if (createdTemporary && fs.existsSync(TEMPORARY)) {
        const directory = verifyCleanupScope(TEMPORARY);
        fs.rmSync(directory, {recursive: true, force: true});
        check(!fs.existsSync(directory), 'Dedicated browser temporary directory removed');
      }
      result.temporary_directory_removed = createdTemporary && !fs.existsSync(TEMPORARY);
    } catch (error) {
      failure ||= error;
      result.pass = false;
      result.cleanup_error = String(error.stack || error);
    }
    result.checks = checks;
    result.finished = new Date().toISOString();
    fs.writeFileSync(REPORT, JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify(result));
  if (failure) { console.error(failure); process.exitCode = 1; }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
