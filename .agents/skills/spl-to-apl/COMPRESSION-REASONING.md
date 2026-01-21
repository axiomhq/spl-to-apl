# SKILL.md Compression Reasoning

Traces each decision from SKILL.md (3,938 tokens) to SKILL.draft.md (1,894 tokens) with measurements.

## Result

```bash
node -e "
const { encode } = require('gpt-tokenizer');
const fs = require('fs');
const original = fs.readFileSync('SKILL.md', 'utf8');
const draft = fs.readFileSync('SKILL.draft.md', 'utf8');
console.log('ORIGINAL:', encode(original).length, 'tokens');
console.log('DRAFT:', encode(draft).length, 'tokens');
"
# ORIGINAL: 3938 tokens
# DRAFT:    1894 tokens (52% reduction, under 2000 ceiling)
```

---

## 1. Critical Differences — front-loading gotchas

**change:** moved failure-mode gotchas to top of file.

```bash
grep -n "Time is explicit\|join.*Preview\|cidrmatch\|args reversed" SKILL.md
# 13:  Time is explicit (top 3% ✓)
# 44:  join Preview (top 9% ✓)
# 165: cidrmatch reversed (35% — middle, degraded attention zone)
```

**justification:** liu et al. "lost in the middle" — models attend better to beginning/end. cidrmatch at line 165/467 is middle territory.

---

## 2. Core Command Mappings — 21 rows kept

**measurement:** command frequency in examples.md

```bash
grep -oE '\| (stats|eval|where|search|join|rex|timechart|dedup|top|sort|head|table|project|summarize|extend|parse|extract|order|take|union|mv-expand|spath|transaction|rare)' reference/examples.md | sort | uniq -c | sort -rn
```

| command | occurrences | kept |
|---------|-------------|------|
| where | 49 | ✓ |
| summarize | 27 | ✓ |
| stats | 17 | ✓ |
| extend | 14 | ✓ |
| eval | 9 | ✓ |
| sort | 6 | ✓ |
| timechart | 4 | ✓ |
| project | 4 | ✓ |
| order | 4 | ✓ |
| join | 4 | ✓ |
| rex | 3 | ✓ |
| dedup | 3 | ✓ |
| spath | 2 | ✓ |
| top | 2 | ✓ |
| take | 2 | ✓ |
| table | 2 | ✓ |
| parse | 2 | ✓ |
| mv-expand | 2 | ✓ |
| transaction | 1 | ✓ |
| rare | 1 | ✓ |
| search | 1 | ✓ |
| head | 1 | ✓ |

**cut commands (0 occurrences):** tail, regex, lookup, fillnull, bucket, chart, eventstats, streamstats

```bash
grep -oE '\| (tail|regex|lookup|fillnull|bucket|chart|eventstats|streamstats)' reference/examples.md | wc -l
# 0
```

---

## 3. Stats → Summarize — 10 functions kept

```bash
grep -oE '(count|dcount|avg|sum|min|max|percentile|countif|make_list|make_set|arg_max|arg_min)\(' reference/examples.md | sort | uniq -c | sort -rn
```

| function | occurrences | kept |
|----------|-------------|------|
| count() | 40 | ✓ |
| countif | 11 | ✓ |
| avg | 6 | ✓ |
| percentile | 5 | ✓ |
| dcount | 5 | ✓ |
| max | 4 | ✓ |
| sum | 3 | ✓ |
| min | 3 | ✓ |
| make_set | 3 | ✓ |
| make_list | 2 | ✓ |
| arg_max | 2 | ✓ |

**cut functions (0 occurrences):** stdev, variance, rate

```bash
grep -oE '(stdev|variance|rate)\(' reference/examples.md | wc -l
# 0
```

---

## 4. Eval → Extend — 11 functions kept

```bash
grep -oE '(iff|case|strlen|tolower|toupper|substring|replace_string|toint|tolong|toreal|split|strcat_array|array_length)\b' reference/examples.md | sort | uniq -c | sort -rn
```

| function | occurrences | kept |
|----------|-------------|------|
| iff | 8 | ✓ |
| case | 5 | ✓ |
| split | 4 | ✓ |
| toreal | 4 | ✓ |
| strcat_array | 2 | ✓ |
| toint | 2 | ✓ |
| array_length | 1 | ✓ |

**cut functions (0 occurrences):** hash_md5, hash_sha*, sqrt, pow, abs, floor, ceiling

```bash
grep -oE '(hash_md5|hash_sha|sqrt|pow|abs|floor|ceiling)\b' reference/examples.md | wc -l
# 0
```

---

## 5. Examples — load-bearing vs decorative

**principle:** "one example per axis of variation" (skill-archetype-research-report.md)

### Kept: conditional count

```bash
grep -i "count(eval" SKILL.md
# shows: count(eval(status>=500)) → countif(status >= 500)
```

Table only has `count(field)` → `countif(isnotnull(field))`. The eval-inside-count pattern is NOT in the table.

### Kept: case statement with implicit default

```bash
grep -i "1==1" SKILL.md
# shows: SPL 1==1 catch-all becomes implicit default in APL
```

Table says "Requires default" but doesn't show the `1==1` transformation.

### Kept: transaction-like grouping

Shows `make_list(pack(...))` pattern — no direct equivalent, requires reconstruction.

### Cut: basic stats example

```
| stats count by status → | summarize count() by status
```

Exactly restates table rows `stats` → `summarize` and `count` → `count()`. Decorative.

---

## 6. Common Patterns — 4 examples kept

| pattern | unique transformation | kept |
|---------|----------------------|------|
| Error rate calculation | countif + extend + toreal composition | ✓ |
| Subquery | let statement pattern | ✓ |
| Join datasets | preview syntax with subquery | ✓ |
| Transaction-like | make_list + pack reconstruction | ✓ |
| Error count by host | just stats + where | ✗ |
| Top 10 URIs | just stats + top | ✗ |
| Percentile latency | just timechart + percentile | ✗ |
| Dedup by user | covered in command table | ✗ |

---

## Limitations

1. **"High frequency" threshold** — used ≥1 occurrence in examples.md; no evidence this is optimal
2. **Reference file fetching** — assumes agents read references when needed; not measured
