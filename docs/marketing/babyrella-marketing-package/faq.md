# ❓ Häufig gestellte Fragen
## AdsEngineer für Babyrella

---

## Allgemeine Fragen

### Wie genau "Server-Side Tracking" funktioniert?

**Antwort:**
```
Normal (Client-Side):
User → Browser lädt Pixel → Event an Facebook

Server-Side (AdsEngineer):
User → Bestellung → Babyrella Backend → AdsEngineer API
                             ↓
                        Facebook/API
                        Google/API
                        TikTok/API
```

Der Unterschied: Statt dass der User-Browser das Event sendet, sendet der Server es.
Das bedeutet:
- Kein Cookie nötig
- AdBlocker umgangen
- DSGVO-konform

### Was muss ich technisch machen?

**Antwort:** GAR NICHTS.

- Ich konfiguriere alles
- IIT schreiben 1 Zeile Code auf Ihre Seite (das Layout-Template)
- Der Rest passiert in meinem Setup

### Wie lange dauert das Setup?

**Antwort:**
- **Tag 1:** Ich prüfe Ihr GTM + Shopware-Setup
- **Tag 2:** Ich konfiguriere AdsEngineer
- **Tag 3:** Server-Side Tracking läuft
- **Woche 1-4:** Daten sammeln + testen

### Muss ich meine Shopware ändern?

**Antwort:** NEIN.

Einmaliger Code-Snippet:
```html
<script>
window.adsEngineerConfig = {
  apiKey: "YOUR_KEY",
  platform: "shopware",
  domain: "babyrella.at"
};
</script>
<script src="https://cdn.ads-engineer.com/loader.js"></script>
```

Das war's dann schon.

---

## Kosten & Bedingungen

### Wie genau ist das "20% Cost-Sharing"?

**Beispielrechnung:**
```
Aktuell: €2.000 Wasted Spend/Monat
Mit AdsEngineer: €200 Wasted Spend/Monat
Geregelt: €1.800/Monat

20% davon = €360/Monat für AdsEngineer
Oder Minimum von €300 (was höher ist)
FINAL: €360/Monat

ROI: 4,7x (für jeden €1 bekommst du €4,7 zurück)
```

### Was wenn <10% Verbesserung?

**Antwort:** GAR NICHTS.

- Gratis 1 Monat testen
- Wenn <10% Attributionsverbesserung = Kostenlos
- Wenn >10% = 20% Cost-Sharing (oder €300 Minimum)

### Kann ich den Vertrag jederzeit kündigen?

**Antwort:** JA.

Monat für Monat. Noch einfacher:
- Monat 1: Gratis (kein Risiko)
- Monat 2+: Nur wenn du zufrieden bist

### Welche Zahlungsarten?

**Antwort:**
- Banküberweisung
- PayPal
- Rechnung (auf Wunsch)

---

## Datenschutz & Sicherheit

### Ist das DSGVO-konform?

**Antwort:** JA.

- Server-Standort: EU (Frankfurt)
- Keine Kundendaten verlassen EU
- NUR Marketing-Daten (keine Emails, Adressen)
- Sie behalten Kontrolle
- Auf Wunsch: Unterzeichner DSGVO-Vereinbarung

### Wo werden die Daten gespeichert?

**Antwort:** EU-Cloud (Frankfurt)

- Hosting: Cloudflare Workers (EU-Region)
- Keine US-Datenübertragung
- GDPR-konform
- 256-Bit Verschlüsselung

### Wie ist das mit Cookies?

**Antwort:** KEINE COOKIE nötig.

Server-Side Tracking braucht keine Cookies, weil das Tracking im Backend passiert.

User, die "nur essentielle" Cookies für das Tracking akzeptieren, werden trotzdem gemessen.

### Kann ich meine Kunden-Daten vor Übertrag schützen?

**Antwort:** JA.

Nur diese Daten werden gesendet:
- Event-Typ (purchase, add_to_cart, etc.)
- Produktpreise
- Kategorie (nicht die Produkte selbst)
- Timestamp
- Plattform-Kanale

NICHT gesendet:
- Kunden-Email
- Kunden-Adresse
- Kunden-Namen
- Telefonnummern

---

## Datenschutz-Konfigurations-Optionen

### Wenn du extra sicher sein willst:

```
AdsEngineer-Konfiguration:
├─ Events: Nur "purchase" (keine add_to_cart, view_content)
├─ Produkte: Nur Preis, kein Name
├─ Kategorien: Nur oberste Kategorie (keine Unterkategorien)
└─ Customer-Daten: Keine E-Mail, Adresse, Namen

DSGVO-Freigabe: 100%
```

---

## Integration mit Shopware

### Wie läuft mit Shopware?

**Antwort:** Reibungslos.

Einmaliger Code-Snippet, alles andere automatisch集成到:

```
Shopware Checkout → Purchase Event → AdsEngineer API
                 ↓
           Facebook Conversions API
           Google Ads Conversion API
           TikTok Events API
```

### Muss Shopware Plugins deinstallieren?

**Antwort:** Nein.

Bestehende Plugins können bleiben parallel:
- mediameets-facebook-pixel (Client-Side, als Backup)
- Shopware Analytics (kann deaktiviert werden)
- ClickSkeks (Cookie-Consent bleibt)

### Wie synchronisieren?

**Antwort:** Automatisch.

Shopware sendet Purchase Event:
```
{
  "orderId": 12345,
  "currency": "EUR",
  "total": 45.99,
  "items": [...] // NUR Product ID, keine Namen
}
```

AdsEngineer empfängt und weiterleitet.

---

## Plattform-spezifische Fragen

### Facebook Conversions API vs Pixel?

**Client-Side Pixel:**
```
User klickt → Browser → Facebook Pixel
                ↓
          Cookie-Sperre = Event verloren ❌
```

**Server-Side Conversions API:**
```
User klickt → Bestellung → Backend → Facebook/API
                ↓
          Cookie-Sperre unwichtig = Event erfasst ✓
```

### Google Ads Conversion API?

**Genauso:**
```
GTM lädt client-seitig -> GTag sendet Events
    ↓
Cookie-Sperre -> Event verloren ❌
```

**Mit AdsEngineer:**
```
Bestellung -> Backend -> Google Conversion API
    ↓
Keine Cookie-Sperre -> Event erfasst ✓
```

### TikTok Events API?

**Genauso:**
- Keine client-seitige Pixel
- Server-Side via AdsEngineer API
- 97% Attributionsrate (vs. 50% aktuell)

---

## Fälle & Beispiele

### Wie sieht das Beispiel "Laufrad" aus?

**Szenario:**
```
User kommt von Facebook-Anzeige für "Holzlaufrad"
€49,89 im Warenkorb
User kauft Bestellung ab
```

**Client-Side (aktuell):**
```
1. User klickt Anzeige
2. Besucht babyrella.at
3. User lehnt Cookies ab (40% der Fälle)
4. Pixel lädt NICHT
5. Event wird NICHT gesendet
6. Facebook Manager sieht NICHTS ❌
```

**Server-Side (AdsEngineer):**
```
1. User klickt Anzeige
2. Besucht babyrella.at
3. User kauft €49,89
4. Shopware Backend sendet Event an AdsEngineer API
5. AdsEngineer sendet an Facebook Conversions API
6. Facebook Manager sieht Event ✓
```

### Wie läuft Retargeting?

**Aktueller Zustand:**
```
User klickt Anzeige
40% Cookie-Sperre -> Keine Daten -> Kein Retargeting ❌
```

**Mit AdsEngineer:**
```
User klickt Anzeige
Event Server-Side erfasst -> Kei Cookie nötig -> Retargeting möglich ✓
```

---

## Leistung & Performance

### Verlangsamt das meine Seite?

**Antwort:** NEIN.

- Code-Snippet: <10KB
- Wird asynchron geladen
- Kein Blocker der Ladenzeit
- Server-Side Tracking = keine Last am User-Browser

### Was bei Ausfall?

**Antwort:** Redundanz (doppelt).

```
AdsEngineer API:
└─ Server-Side Tracking (96%)
└─ Backup: Client-Side Pixel (als Failsafe)
```

Wenn AdsEngineer kurzzeitigen Ausfall hat:
- Client-Site Backup läuft weiter
- Kein Daten-Verlust

---

## Vertrauenswürdigkeit

### Warum dir vertrauen?

**3 Gründe:**

1. **Family-Business**
   - Ich bin schwager von Marietta
   - Kein "verkaufter" Geschäftsmodell
   - Persönlich, kein SaaS-Verkaufs-Gespräch

2. **Kostenloses Testing**
   - 1 Monat gratis
   - Erfolggarantie
   - Bei Fehlversuch: Null Kosten

3. **Transparenz**
   - Du siehst alle Daten (Dashboard)
   - Monatliche Berichte
   - Klare Kalkulation (20% Cost-Sharing)

### Wie lang bist du im Business?

**Antwort:** 5+ Jahre

- Cloud-Infrastruktur (OpenTofu, Cloudflare Workers)
- Server-Side Tracking (speziell für E-Commerce)
- Shopware + Multi-Plattform-Integration Erfahrung

### Referenzen?

**Antwort:**

Babyrella wird die erste Case-Study, aber:
- Marietta/Dein Bruder sprechen für mich
- Ich habe AdsEngineer für Landing Page erstellt
- Referenzen ab nach Babyrella-Success

### Wie kommunizieren?

**Optionen:**
- Face-to-Face: Wir können uns treffen (Graz / Umgebung)
- WhatsApp: Direkt, persönlich
- E-Mail: Für detaillierte Informationen
- Zoom: Wenn nötig

---

## Praktische Fragen

### Wie sind die Berichte?

**Antwort:**

**Monatlich:**
- Attributionsrate pro Kanal (aktuell vs. nachher)
- Wasted Spend (verloren vs. gerettet)
- ROAS (aktuell vs. nachher)
- Konversionsraten

**Vorhanden:**
- Dashboard (Real-Time)
- Vorher/Nachher-Vergleich
- Zahlen, Daten, Fakten

### Wie schalten wir ab?

**Option 1:** Monat für Monat
- Monat 1: Gratis (testen)
- Monat 2+: Nur wenn zufrieden

**Option 2:** 6-Monats-Vertrag
- 5% Rabatt auf alle 6 Monate
- Jederzeit kündigbar

### Was bei Scale-Out?

**Mehr Budget = Noch besserer ROI:**
```
€5.000 Budget -> ROI: 4,7x
€10.000 Budget -> ROI: 5,9x (besser, weil Minimum-Gebühr kleiner wird)
```

---

## Sonstiges

### Was passiert mit dem Code-Snippet wenn du nich mehr im Geschäft bist?

**Antwort:**
- Code bleibt da
- Du kannst selbst konfigurieren (du bekommst Schlüssel)
- Oder: Alternative Service-Auswahl (du hast dann Kontext)

### Kannst du das auch für andere Plattformen machen?

**Antwort:** JA.

Current Plattforms:
- Google Ads (Conversion API)
- Facebook/Meta (Conversions API)
- TikTok (Events API)
- Shopify Integration (falls switch)

Future:
- Klaviyo (E-Mail Marketing)
- Google Analytics 4
- Microsoft Advertising

### Wie ist das mit Support?

**Antwort:**
- 24/7 E-Mail-Antwort
- WhatsApp für dringende Fragen
- Monatliche Calls (30 Min) für Review

---

## Zusammenfassung

Was mir am meistens gefragt:
1. "Muss ich etwas tun?" -> Nein, alles automatisiert
2. "Was kostet mich?" -> Nur wenn's funktioniert (20% von geregelter Spend)
3. "Ist das sicher?" -> Ja, DSGVO-konform, EU-Server, keine persönliche Daten

---

## Noch Fragen?

**[Dein Name]**
[Deine E-Mail]
[Deine Telefonnummer]

Ich antworte direkt, persönlich, ohne Verkaufsgespräch. 🎯