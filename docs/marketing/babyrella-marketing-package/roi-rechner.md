# 💰 ROI-Rechner: Was Sie mit AdsEngineer gewinnen

## Interaktiver ROI-Kalkulator (Schablonen-Beispiel)

### Geben Sie Ihre Daten ein:

```python
# Kalkulator-Sabe (Python/JavaScript-Konzept)

# ============ EINGABE ============
monatliche_werbeausgaben = 5000      # € - Ihr aktuelles Werbebudget
facebook_anteil = 0.60                # 60% Ihres Budgets
google_anteil = 0.30                  # 30% Ihres Budgets
tiktok_anteil = 0.10                  # 10% Ihres Budgets

current_attribution_facebook = 0.60   # 60% Attributionsrate
current_attribution_google = 0.70     # 70% Attributionsrate
current_attribution_tiktok = 0.50     # 50% Attributionsrate

new_attribution_facebook = 0.95       # 95% mit AdsEngineer
new_attribution_google = 0.98          # 98% mit AdsEngineer
new_attribution_tiktok = 0.97         # 97% mit AdsEngineer

performance_fee_percent = 0.20        # 20% Cost-Sharing (Ihr Angebot)
minimum_fees_monthly = 300

# ============ BERECHNUNGEN ============

# Aktuell
facebook_visible_current = monatliche_werbeausgaben * facebook_anteil * current_attribution_facebook
google_visible_current = monatliche_werbeausgaben * google_anteil * current_attribution_google
tiktok_visible_current = monatliche_werbeausgaben * tiktok_anteil * current_attribution_tiktok
total_visible_current = facebook_visible_current + google_visible_current + tiktok_visible_current

# Mit AdsEngineer
facebook_visible_new = monatliche_werbeausgaben * facebook_anteil * new_attribution_facebook
google_visible_new = monatliche_werbeausgaben * google_anteil * new_attribution_google
tiktok_visible_new = monatliche_werbeausgaben * tiktok_anteil * new_attribution_tiktok
total_visible_new = facebook_visible_new + google_visible_new + tiktok_visible_new

# Zuwachs
visible_gain = total_visible_new - total_visible_current
visible_gain_percent = (visible_gain / total_visible_current) * 100

# Wasted Spend (Verlust)
facebook_wasted_current = monatliche_werbeausgaben * facebook_anteil * (1 - current_attribution_facebook)
google_wasted_current = monatliche_werbeausgaben * google_anteil * (1 - current_attribution_google)
tiktok_wasted_current = monatliche_werbeausgaben * tiktok_anteil * (1 - current_attribution_tiktok)
total_wasted_current = facebook_wasted_current + google_wasted_current + tiktok_wasted_current

facebook_wasted_new = monatliche_werbeausgaben * facebook_anteil * (1 - new_attribution_facebook)
google_wasted_new = monatliche_werbeausgaben * google_anteil * (1 - new_attribution_google)
tiktok_wasted_new = monatliche_werbeausgaben * tiktok_anteil * (1 - new_attribution_tiktok)
total_wasted_new = facebook_wasted_new + google_wasted_new + tiktok_wasted_new

wasted_recovered = total_wasted_current - total_wasted_new

# Kosten für Sie
performance_fee = wasted_recovered * performance_fee_percent
final_fee = max(performance_fee, minimum_fees_monthly)

# ROI
roi_client = visible_gain / final_fee if final_fee > 0 else float('inf')

# ============ AUSGABE ============
print(f"ROI für Sie: {roi_client:.2f}x")
```

---

## Beispiel 1: Babyrella (monatlich €5.000)

### Eingabe-Werte:
- Monatliche Werbeausgaben: €5.000
- Facebook: 60%, Google: 30%, TikTok: 10%

### Berechnung:

```
AKTUELL (Client-Side):
─────────────────────────────────────────────
Facebook: 60% von €3.000 = €1.800 sichtbar
Google:   70% von €1.500 = €1.050 sichtbar
TikTok:   50% von €500 = €250 sichtbar
─────────────────────────────────────────────
Gesamt sichtbar: €3.100
Gesamt verloren: €1.900 (38% Wasted Spend)


MIT ENGINEER (Server-Side):
─────────────────────────────────────────────
Facebook: 95% von €3.000 = €2.850 sichtbar
Google:   98% von €1.500 = €1.470 sichtbar
TikTok:   97% von €500 = €485 sichtbar
─────────────────────────────────────────────
Gesamt sichtbar: €4.805
Gesamt verloren: €85 (1,7% Wasted Spend)


ZUWACHS:
─────────────────────────────────────────────
Sichtbare Umsätze steigen von €3.100 auf €4.805
Zuwachs: +€1.705/Monat
Jährlich: +€20.460

Wasted Spend geregelt:
Von €1.900/Monat auf €85/Monat
Geregelt: €1.815/Monat


KOSTEN NACHHER:
─────────────────────────────────────────────
20% von geregelter €1.815 = €363/Monat
oder Minimum von €300/Monat
FINAL: €363/Monat


ROI FÜR SIE:
─────────────────────────────────────────────
Gewinn: €1.705/Monat
Kosten: €363/Monat
ROI: 4.7x (für jeden €1 bekommst du €4,7 zurück)
```

---

## Beispiel 2: Kleines E-Commerce (monatlich €2.000)

### Eingabe-Werte:
- Monatliche Werbeausgaben: €2.000
- Facebook: 50%, Google: 35%, TikTok: 15%

### Berechnung:

```
AKTUELL:
─────────────────────────────────────────────
Facebook: 60% von €1.000 = €600
Google:   70% von €700 = €490
TikTok:   50% von €300 = €150
─────────────────────────────────────────────
Gesamt: €1.240 sichtbar
Verloren: €760 (38%)


MIT ENGINEER:
─────────────────────────────────────────────
Facebook: 95% von €1.000 = €950
Google:   98% von €700 = €686
TikTok:   97% von €300 = €291
─────────────────────────────────────────────
Gesamt: €1.927 sichtbar
Verloren: €40 (2%)


ZUWACHS:
─────────────────────────────────────────────
Sichtbare Umsätze: +€687/Monat
Jährlich: +€8.244

Geregelter Wasted Spend: €720/Monat


KOSTEN:
─────────────────────────────────────────────
20% von €720 = €144/Monat
Minimum: €300/Monat
FINAL: €300/Monat


ROI:
─────────────────────────────────────────────
Gewinn: €687
Kosten: €300
ROI: 2.3x
```

**Hinweis:** Bei kleineren Budgets ist das Minimum der limitierende Faktor.

---

## Beispiel 3: Mittleres E-Commerce (monatlich €8.000)

### Eingabe-Werte:
- Monatliche Werbeausgaben: €8.000
- Facebook: 55%, Google: 30%, TikTok: 15%

### Berechnung:

```
AKTUELL:
─────────────────────────────────────────────
Facebook: 60% von €4.400 = €2.640
Google:   70% von €2.400 = €1.680
TikTok:   50% von €1.200 = €600
─────────────────────────────────────────────
Gesamt: €4.920 sichtbar
Verloren: €3.080 (38,5%)


MIT ENGINEER:
─────────────────────────────────────────────
Facebook: 95% von €4.400 = €4.880
Google:   98% von €2.400 = €2.352
TikTok:   97% von €1.200 = €1.164
─────────────────────────────────────────────
Gesamt: €8.396 sichtbar
Verloren: €104 (1,3%)


ZUWACHS:
─────────────────────────────────────────────
Sichtbare Umsätze: +€3.476/Monat
Jährlich: +€41.712

Geregelter Wasted Spend: €2.976/Monat


KOSTEN:
─────────────────────────────────────────────
20% von €2.976 = €595/Monat
Minimum: €300/Monat
FINAL: €595/Monat


ROI:
─────────────────────────────────────────────
Gewinn: €3.476
Kosten: €595
ROI: 5.8x
```

---

## ROI-Tabelle (verschiedene Budgets)

| Monatliches Budget | Sichtbar vorher | Sichtbar nachher | Zuwachs | Kosten | ROI | Empfehlung |
|-------------------|-----------------|------------------|---------|--------|-----|------------|
| €1.000 | €600 | €950 | +€350 | €300 | 1.1x | Nein |
| €2.000 | €1.240 | €1.927 | +€687 | €300 | 2.3x | Ja |
| **€3.000** | **€1.860** | **€2.906** | **+€1.046** | **€300** | **3.5x** | **Ja** |
| **€5.000** | **€3.100** | **€4.805** | **+€1.705** | **€363** | **4.7x** | **Ja** |
| **€8.000** | **€4.920** | **€8.396** | **+€3.476** | **€595** | **5.8x** | **Ja** |
| €10.000 | €6.150 | €10.484 | +€4.334 | €734 | 5.9x | Ja |
| €15.000 | €9.225 | €15.726 | +€6.501 | €1.071 | 6.1x | Ja |
| €20.000 | €12.300 | €20.956 | +€8.656 | €1.404 | 6.2x | Ja |
| €30.000 | €18.450 | €31.434 | +€12.984 | €2.068 | 6.3x | Ja |
| €50.000 | €30.750 | €52.390 | +€21.640 | €3.410 | 6.3x | Ja |

**Erklärung:**
- **Unter €2.500**: Minimum-Gebühr limitiert ROI (nicht empfohlen)
- **€2.500-€10.000**: Perfekter Bereich für AdsEngineer
- **Über €10.000**: ROI bleibt stabil bei ~6x

---

## Break-Even-Analyse

### Wann lohnt sich der Wechsel?

#### Breakeven-Punkt für €5.000 Budget:

```
Kosten für AdsEngineer: €363/Monat
Benötigter Zuwachs: €363

Aktuelle Sichtbare: €3.100
Notwendig: €3.463 (für Break-Even)

Mit AdsEngineer erreicht: €4.805
Tatsächlicher Zuwachs: €1.705

Break-Even erreicht bei:
1.705 - 363 = €1.342 Netto Gewinn
```

#### Breakeven-Budget-Untergrenze:

**Berechnung:**

```python
# Minimum-Fee: €300/Monat
# Minimum-Guwachs für Gleichstand: €300

# Aktuelles Setup durchschnittlich: 60% Attributionsrate
# Mindestbudget für €300 Gewinn bei 60%:
new_visible - current_visible = 300
budget * 0.96 - budget * 0.60 = 300
budget * 0.36 = 300
budget = 300 / 0.36
budget = €833/Monat

# Aber Minimum-Gebühr ist €300, nicht 20% von geregelter
# Also:
current_visible = budget * 0.60
new_visible = budget * 0.96
gewinn = new_visible - current_visible = budget * 0.36

gewinn >= 300
budget * 0.36 >= 300
budget >= 833
```

**Antwort: Ab €833/Monat Budget ist es break-even**

Aber praktisch: Empfohlen ab €2.000/Monat, weil:
- ROI besser sein sollte
- Setup-Kosten amortisieren
- Real-World-Streuung (nicht immer 100% perfekte Situation)

---

## ROI-Vergleich: AdsEngineer vs. Andere Optionen

### Option 1: Bleiben wie jetzt

```
Monat: €5.000
Attributionsverlust: 40%
Verloren: €2.000/Monat = €24.000/Jahr
ROI: Unbekannt
Kosten: Gratis
Verlust: €24.000/Jahr
```

### Option 2: Manuelle Server-Side Setup (selbst)

```
Setup-Zeitaufwand: ~40 Stunden
Wartung: ~8 Stunden/Monat
Entwickler-Kosten: ~€150/Stunde
───────────────────────────────
Setup-Kosten: 40 * 150 = €6.000
Wartung/Kosten: 8 * 150 = €1.200/Monat
Jahreskosten (außer Setup): €14.400
ROI: ~1.0x (kostet so viel wie es rettet)
```

### Option 3: AdsEngineer

```
Setup-Kosten: Gratis
Wartung: Inklusive
Kosten: 20% Cost-Sharing oder €300 Minimum
Jahreskosten: ~€4.356
ROI: ~5x
```

### Tabelle:

| Option | Setup-Kosten | Jahreskosten | ROI | Aufwand |
|--------|-------------|--------------|-----|--------|
| Bleiben | €0 | €0 (aber €24K Verlust) | - | 0h |
| Manuell | €6.000 | €14.400 | 1.0x | 96h/Jahr |
| **AdsEngineer** | **€0** | **~€4.356** | **5x** | **0h** |

---

## ROI-Berechnungs-Rahmen für Kunden

### So erklären Sie es Marietta:

```
"Marietta, Sie geben €5.000/Monat für Werbung aus.
Davon werden rund 40% nicht gemessen = €2.000/Monat.
Jährlich ist das €24.000 im Marketing verbrannt.

Mit AdsEngineer:
- Wir heben die Verluste auf ~4% = €200/Monat
- Geregelt: €1.800/Monat
- Kosten: 20% davon = €360/Monat (oder €300 Minimum)

Gewinn für Sie:
Jahr 1: €1.704 * 12 - €360 * 12 = €16.128
ROI: 4,7x

Zusammengefasst:
- Pro €1, den Sie mir zahlen, kriegen Sie €4,7 zurück
- Risiko 0: 1 Monat gratis testen
- Wenn nichts funktioniert: Keine Kosten"
```

---

## Langfristige ROI-Projektion

### 5-Jahres-ROI bei Babyrella (Annahme: 5% Wachstum/Jahr)

| Jahr | Werbebudget Monat | Zuwachs/Kosten | ROI | Kumulativ |
|------|-------------------|-----------------|-----|-----------|
| **1** | €5.000 | +€16.128 | 4.7x | €16.128 |
| **2** | €5.250 | +€17.000 | 4.7x | €33.128 |
| **3** | €5.512 | +€18.000 | 4.7x | €51.128 |
| **4** | €5.788 | +€19.100 | 4.7x | €70.228 |
| **5** | €6.077 | +€20.300 | 4.7x | €90.528 |

**Gesamt in 5 Jahren:** +€90.528 Gewinn

---

## Wann ist AdsEngineer NICHT sinnvoll?

### Kriterien für "Nicht geeignet:"

1. **Budget unter €500/Monat**
   - ROI: <1x
   - Minimum-Gebühr fresst alles auf
   - Empfehlung: Vorerst nicht, bis Skalierung

2. **Keine Werbemaßnahmen**
   - Nur SEO, keine Paid Ads
   - AdsEngineer geht um Ad Attribution, nicht um SEO
   - Empfehlung: Nicht nötig

3. **Nur ein Kanal (z.B. nur Facebook)**
   - ROI kleiner, aber immer noch positiv
   - Empfehlung: Kann trotzdem helfen (geringerer ROI)

---

## Zusammenfassung

### ROI bei verschiedenen Budgets:

| Budget | ROI | Empfehlung |
|--------|-----|------------|
| <€1.000 | <1x | Nein |
| €1.000-€2.000 | 1-2x | Ja |
| €2.000-€10.000 | 2-6x | Ja |
| >€10.000 | ~6x | Ja |

### Kern-Botschaft:
- **Mindestens 2x ROI** bei Budgets über €2.000
- **Kein Risiko** (1 Monat gratis testen)
- **Family-Business** (Vertrauen, kein Verkaufsgespräch)

**Nächster Schritt:** Lassen Sie uns die Zahlen im Real-World testen!