#!/usr/bin/env python3
"""Ping IndexNow (Bing, and any engine on the protocol) with every URL in the
freshly built sitemap so new/updated pages get crawled within minutes instead
of weeks. Runs as the last step of `make deploy` — after the rsync, so the
engines fetch the live versions.

The key lives in build/.indexnow-key (gitignored) and its public counterpart
must be served at https://mediprimer.org/<key>.txt (it is, from public/).
Fails loudly: a bad key, missing key file, or non-2xx response exits nonzero
so a broken submission never passes silently."""
import json, os, re, sys, urllib.request

BASE = "https://mediprimer.org"
HERE = os.path.dirname(os.path.abspath(__file__))
KEY_FILE = os.path.join(HERE, ".indexnow-key")
SITEMAP = os.path.join(HERE, "..", "public", "sitemap.xml")

if not os.path.exists(KEY_FILE):
    sys.exit("indexnow: missing %s" % KEY_FILE)
key = open(KEY_FILE).read().strip()
if not re.fullmatch(r"[a-f0-9]{32}", key):
    sys.exit("indexnow: key in %s doesn't look like a 32-char hex key" % KEY_FILE)

key_txt = os.path.join(HERE, "..", "public", key + ".txt")
if not os.path.exists(key_txt) or open(key_txt).read().strip() != key:
    sys.exit("indexnow: public key file public/%s.txt missing or doesn't match the key" % key)

urls = re.findall(r"<loc>(.*?)</loc>", open(SITEMAP).read())
if not urls:
    sys.exit("indexnow: no URLs found in sitemap.xml — run the build first")

payload = json.dumps({
    "host": "mediprimer.org",
    "key": key,
    "keyLocation": "%s/%s.txt" % (BASE, key),
    "urlList": urls,
}).encode()

req = urllib.request.Request(
    "https://api.indexnow.org/indexnow", data=payload,
    headers={"Content-Type": "application/json; charset=utf-8"})
with urllib.request.urlopen(req, timeout=30) as resp:
    if not 200 <= resp.status < 300:
        sys.exit("indexnow: HTTP %d from api.indexnow.org" % resp.status)
    print("indexnow: submitted %d urls (HTTP %d)" % (len(urls), resp.status))
