# TEMPLATE · Landing Universal de 9 Secciones
## Estructura ZENKAI estándar · adaptable a cualquier sector

---

## METADATA DE LA LANDING

```
PROYECTO: [PROYECTO_NOMBRE]
CLIENTE: [CLIENTE_NOMBRE]
SECTOR: [SECTOR]
TIER: [ECO · PRO · PREMIUM]
CTA PRIMARIO: [WHATSAPP · FORMULARIO · COMPRA · LLAMADA]
URL DESTINO: [URL_FINAL]
PALETA: [HEX_PRIMARY · HEX_SECONDARY · HEX_ACCENT]
TIPOGRAFÍA: [DISPLAY_FONT · BODY_FONT]
```

---

## 01 · HERO

```html
<section class="hero">
  <h1>[HEADLINE_PRINCIPAL]</h1>
  <p class="subheadline">[SUBHEADLINE_2_LINEAS]</p>
  <a href="https://wa.me/[WHATSAPP_NUMERO]?text=[MENSAJE_PREDEFINIDO]" 
     class="cta-primary">
    [CTA_PRIMARIO_TEXTO]
  </a>
  <img src="[HERO_IMAGEN_URL]" alt="[HERO_ALT_TEXT]" />
</section>
```

**Reglas del HERO:**
- Headline: máx 12 palabras · benefit-driven
- Subheadline: 2 líneas máx · explica el cómo
- CTA visible sin scroll en mobile
- Imagen: real, no stock obvia

**Ejemplos de headlines por sector:**
- E-commerce: "Convierte tus ads en ventas — sin perder un peso en clicks que no compran"
- Salud: "Llenamos tu agenda médica — y reducimos no-shows en 40%"
- Restaurantes: "[Restaurante]: pedidos por WhatsApp, sin apps que se llevan tu margen"
- Servicios: "Más leads de calidad — menos tiempo en cotizaciones manuales"

---

## 02 · DOLOR

```html
<section class="dolor">
  <h2>¿Te suena alguno de estos?</h2>
  <ul class="dolor-list">
    <li>
      <icon>[ICON_1]</icon>
      <strong>[DOLOR_1_TITULO]</strong>
      <p>[DOLOR_1_DESCRIPCION]</p>
    </li>
    <li>
      <icon>[ICON_2]</icon>
      <strong>[DOLOR_2_TITULO]</strong>
      <p>[DOLOR_2_DESCRIPCION]</p>
    </li>
    <li>
      <icon>[ICON_3]</icon>
      <strong>[DOLOR_3_TITULO]</strong>
      <p>[DOLOR_3_DESCRIPCION]</p>
    </li>
  </ul>
</section>
```

**Regla:** dolores en primera persona del cliente ("Siento que…", "No logro…", "Cada vez que…").

---

## 03 · SOLUCIÓN

```html
<section class="solucion">
  <h2>Así te ayudamos</h2>
  <ol class="proceso-4-pasos">
    <li>
      <span class="numero">01</span>
      <h3>[PASO_1_TITULO]</h3>
      <p>[PASO_1_DESCRIPCION]</p>
    </li>
    <li>
      <span class="numero">02</span>
      <h3>[PASO_2_TITULO]</h3>
      <p>[PASO_2_DESCRIPCION]</p>
    </li>
    <li>
      <span class="numero">03</span>
      <h3>[PASO_3_TITULO]</h3>
      <p>[PASO_3_DESCRIPCION]</p>
    </li>
    <li>
      <span class="numero">04</span>
      <h3>[PASO_4_TITULO]</h3>
      <p>[PASO_4_DESCRIPCION]</p>
    </li>
  </ol>
</section>
```

---

## 04 · PRUEBA SOCIAL

```html
<section class="prueba-social">
  <h2>Empresas que ya lo viven</h2>
  
  <!-- Métricas globales -->
  <div class="metricas">
    <div>
      <span class="numero-grande">[METRICA_1_VALOR]</span>
      <p>[METRICA_1_LABEL]</p>
    </div>
    <div>
      <span class="numero-grande">[METRICA_2_VALOR]</span>
      <p>[METRICA_2_LABEL]</p>
    </div>
    <div>
      <span class="numero-grande">[METRICA_3_VALOR]</span>
      <p>[METRICA_3_LABEL]</p>
    </div>
  </div>
  
  <!-- Testimonios con foto -->
  <div class="testimonios">
    <blockquote>
      <p>"[TESTIMONIO_1_TEXTO]"</p>
      <footer>
        <img src="[TESTIMONIO_1_FOTO]" alt="[TESTIMONIO_1_NOMBRE]" />
        <strong>[TESTIMONIO_1_NOMBRE]</strong>
        <span>[TESTIMONIO_1_CARGO_EMPRESA]</span>
      </footer>
    </blockquote>
    
    <blockquote>
      <p>"[TESTIMONIO_2_TEXTO]"</p>
      <footer>
        <img src="[TESTIMONIO_2_FOTO]" alt="[TESTIMONIO_2_NOMBRE]" />
        <strong>[TESTIMONIO_2_NOMBRE]</strong>
        <span>[TESTIMONIO_2_CARGO_EMPRESA]</span>
      </footer>
    </blockquote>
  </div>
  
  <!-- Logos -->
  <div class="logos-clientes">
    <img src="[LOGO_1]" alt="[CLIENTE_1]" />
    <img src="[LOGO_2]" alt="[CLIENTE_2]" />
    <img src="[LOGO_3]" alt="[CLIENTE_3]" />
    <img src="[LOGO_4]" alt="[CLIENTE_4]" />
  </div>
</section>
```

---

## 05 · QUÉ INCLUYE

```html
<section class="que-incluye">
  <h2>Qué incluye exactamente</h2>
  <ul class="checklist">
    <li>✓ [INCLUYE_1]</li>
    <li>✓ [INCLUYE_2]</li>
    <li>✓ [INCLUYE_3]</li>
    <li>✓ [INCLUYE_4]</li>
    <li>✓ [INCLUYE_5]</li>
    <li>✓ [INCLUYE_6]</li>
  </ul>
  
  <h3>Lo que NO incluye este servicio</h3>
  <ul class="excluye">
    <li>✗ [EXCLUYE_1]</li>
    <li>✗ [EXCLUYE_2]</li>
    <li>✗ [EXCLUYE_3]</li>
  </ul>
</section>
```

**Regla:** la sección "lo que no incluye" es decisiva para evitar disputas. NO la omitas.

---

## 06 · PROCESO

```html
<section class="proceso">
  <h2>Cómo trabajamos contigo</h2>
  <div class="timeline">
    <div class="paso">
      <span class="dia">DÍA 1</span>
      <h3>[PROCESO_1_TITULO]</h3>
      <p>[PROCESO_1_DESCRIPCION]</p>
    </div>
    <div class="paso">
      <span class="dia">SEMANA 1</span>
      <h3>[PROCESO_2_TITULO]</h3>
      <p>[PROCESO_2_DESCRIPCION]</p>
    </div>
    <div class="paso">
      <span class="dia">SEMANA 2-3</span>
      <h3>[PROCESO_3_TITULO]</h3>
      <p>[PROCESO_3_DESCRIPCION]</p>
    </div>
    <div class="paso">
      <span class="dia">LANZAMIENTO</span>
      <h3>[PROCESO_4_TITULO]</h3>
      <p>[PROCESO_4_DESCRIPCION]</p>
    </div>
  </div>
</section>
```

---

## 07 · FAQ

```html
<section class="faq">
  <h2>Preguntas frecuentes</h2>
  <details>
    <summary>[FAQ_1_PREGUNTA]</summary>
    <p>[FAQ_1_RESPUESTA]</p>
  </details>
  <details>
    <summary>[FAQ_2_PREGUNTA]</summary>
    <p>[FAQ_2_RESPUESTA]</p>
  </details>
  <details>
    <summary>[FAQ_3_PREGUNTA]</summary>
    <p>[FAQ_3_RESPUESTA]</p>
  </details>
  <details>
    <summary>[FAQ_4_PREGUNTA]</summary>
    <p>[FAQ_4_RESPUESTA]</p>
  </details>
  <details>
    <summary>[FAQ_5_PREGUNTA]</summary>
    <p>[FAQ_5_RESPUESTA]</p>
  </details>
  <details>
    <summary>[FAQ_6_PREGUNTA]</summary>
    <p>[FAQ_6_RESPUESTA]</p>
  </details>
  <details>
    <summary>[FAQ_7_PREGUNTA]</summary>
    <p>[FAQ_7_RESPUESTA]</p>
  </details>
  <details>
    <summary>[FAQ_8_PREGUNTA]</summary>
    <p>[FAQ_8_RESPUESTA]</p>
  </details>
</section>
```

**6-8 FAQs basadas en `sectores/<SECTOR>.md` + objeciones reales que HERMES haya logueado.**

---

## 08 · CTA FINAL

```html
<section class="cta-final">
  <h2>[CTA_FINAL_HEADLINE]</h2>
  <p>[CTA_FINAL_SUBHEADLINE]</p>
  <a href="https://wa.me/[WHATSAPP_NUMERO]?text=[MENSAJE_PREDEFINIDO]" 
     class="cta-primary cta-grande">
    [CTA_FINAL_TEXTO]
  </a>
  
  <!-- Urgencia REAL si la hay · si no, omitir -->
  [URGENCIA_REAL_OPCIONAL]
  
  <!-- Mini prueba social -->
  <p class="prueba-secundaria">
    [METRICA_RAPIDA] · [TESTIMONIO_BREVE]
  </p>
</section>
```

---

## 09 · FOOTER

```html
<footer>
  <div class="footer-info">
    <p>[CLIENTE_NOMBRE]</p>
    <p>[CLIENTE_DIRECCION]</p>
    <p>[CLIENTE_EMAIL] · [CLIENTE_TELEFONO]</p>
  </div>
  
  <div class="footer-legal">
    <a href="/politica-privacidad">Política de Privacidad</a>
    <a href="/terminos">Términos y Condiciones</a>
    <a href="/cookies">Política de Cookies</a>
  </div>
  
  <div class="footer-redes">
    <a href="[INSTAGRAM_URL]">Instagram</a>
    <a href="[FACEBOOK_URL]">Facebook</a>
    <a href="[TIKTOK_URL]">TikTok</a>
    <a href="[LINKEDIN_URL]">LinkedIn</a>
  </div>
  
  <p class="copyright">
    © [AÑO_ACTUAL] [CLIENTE_NOMBRE]. Todos los derechos reservados.
    Sitio construido con ❤️ por [ZENKAI_BRANDING_OPCIONAL]
  </p>
</footer>
```

---

## INTEGRACIONES TÉCNICAS (handoff a NEXUS)

```
□ Pixel Meta + CAPI configurado
  - Eventos: PageView · Lead · Purchase
  - ID Pixel: [PIXEL_ID]
  
□ Google Analytics 4
  - Property ID: [GA4_PROPERTY_ID]
  - Eventos personalizados: [LISTA]

□ Webhook formulario → Make
  - URL webhook Make: [WEBHOOK_URL]
  - Destination Airtable: base [BASE_ID] · tabla `leads`

□ WhatsApp Cloud API
  - Número origen: [WA_NUMERO_ORIGEN]
  - Template HSM: [TEMPLATE_NOMBRE]
  - Latencia objetivo: <30s

□ Email automático
  - Provider: [RESEND · SENDGRID · POSTMARK]
  - Template: [EMAIL_TEMPLATE_ID]
  - Subject: "[EMAIL_SUBJECT]"

□ UTMs
  - utm_source · utm_medium · utm_campaign · utm_content · utm_term
```

---

## QA CHECKLIST (ATLAS-QA antes de publicar)

```
□ Mobile: iPhone Safari · Android Chrome
□ Desktop: Chrome · Firefox · Safari · Edge
□ Tiempos: LCP <2.5s · CLS <0.1 · FID <100ms
□ Imágenes WebP · <300KB cada una
□ Sin errores en consola
□ Sin typos (especialmente ñ y tildes)
□ Contraste WCAG AA · AAA en CTAs
□ Botones >44×44px en mobile
□ Formulario testeado con datos reales
□ Pixel Meta verificado en Events Manager
□ CAPI funcionando (server-side)
□ Mensaje WhatsApp llega en <30s post-form
□ Lead aparece en Airtable
□ Política de privacidad publicada
□ Robots.txt y sitemap.xml
□ Open Graph + Twitter Card
□ Favicon
□ Apple touch icon
```
