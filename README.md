# RallyGo League — MVP Web App

RallyGo League es una app web MVP móvil-first para organizar ligas de pickleball por provincia, categoría y nivel. Todas las imágenes deportivas usadas en la interfaz están guardadas localmente en `assets/` y son de pickleball. Está preparada para abrirse directamente en el navegador sin backend, sin instalación y sin dependencias de build.

## Archivos incluidos

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `assets/` con todas las imágenes deportivas reemplazadas por fotos de pickleball

## Cómo abrir la app

1. Descomprime el ZIP.
2. Abre el archivo `index.html` directamente en Chrome, Safari, Edge o Firefox.
3. También puedes subir la carpeta a Vercel, Netlify, GitHub Pages o cualquier hosting estático.

## Qué funcionalidades son simuladas

Todo funciona con datos locales/falsos:

- Registro falso.
- Login falso.
- Ligas, rankings, jugadores y clubs generados como datos de ejemplo.
- Chats internos simulados.
- Envío de mensajes local.
- Registro de resultados local.
- Incidencias locales.
- Edición de perfil local.
- Descuentos y clubs colaboradores simulados.

No hay backend real, pagos, email real, reservas reales, mapas reales ni moderación real. Los datos se guardan en `localStorage` del navegador.

## Cómo probar el registro

1. En la pantalla inicial pulsa **Crear cuenta**.
2. Completa todos los campos.
3. Acepta términos y privacidad.
4. Pulsa **Crear cuenta y entrar**.
5. La app guardará el usuario en `localStorage` y entrará en la pantalla principal.

## Cómo probar el login demo

En la pantalla inicial pulsa **Entrar en modo demo**.

También puedes ir a **Iniciar sesión**, escribir cualquier email/teléfono y contraseña falsa, y pulsar **Entrar**.

## Cómo probar “Mis partidos”

1. Entra en **Mis partidos** desde la navegación inferior.
2. Filtra por pendientes, programados, jugados o incidencias.
3. Pulsa **Proponer fecha** para simular una fecha de partido.
4. Pulsa **Registrar resultado** para introducir un marcador.
5. Pulsa **Reportar incidencia** para crear una incidencia local.

Al registrar un resultado, el partido cambia visualmente a **Resultado pendiente de confirmar**.

## Cómo probar mensajes

1. Entra en **Mensajes**.
2. Abre una conversación con un rival.
3. Escribe un mensaje y pulsa **Enviar**.
4. Prueba **Reportar** para abrir un modal de reporte.
5. Prueba **Bloquear** para impedir nuevos mensajes en ese chat.

## Cómo probar ligas y rankings

1. Entra en **Ligas**.
2. Filtra por provincia o modalidad.
3. Pulsa **Ver liga**.
4. Cambia categoría y nivel en los selectores.
5. Consulta el ranking general y el ranking por grupo.

Los estados visuales son:

- Primero: **Sube de nivel**.
- Último: **Baja de nivel**.
- Intermedios: **Se mantiene**.

## Cómo probar descuentos

1. Entra en **Descuentos**.
2. Filtra por provincia, ciudad o tipo de descuento.
3. Pulsa **Ver descuento** para abrir el detalle.
4. Pulsa **Cómo llegar** para ver una acción simulada.

## Cómo probar perfil

1. Entra en **Perfil**.
2. Pulsa **Editar perfil**.
3. Cambia ciudad, teléfono, nivel, categoría o avatar.
4. Guarda cambios.
5. Los datos se mantienen en `localStorage`.

Desde Perfil también puedes abrir:

- Mis incidencias.
- Ayuda y FAQ.
- Contacto soporte.
- Términos y condiciones.
- Política de privacidad.
- Cerrar sesión.

## Resetear datos

Para volver al estado inicial:

1. Abre DevTools del navegador.
2. Ve a Application / Storage.
3. Borra el `localStorage` de la página.
4. Recarga `index.html`.

También puedes pulsar **Cerrar sesión** desde Perfil para volver a la pantalla inicial.


## Imágenes de pickleball

Las imágenes deportivas están dentro de la carpeta `assets/`:

- `assets/pickleball-hero-net.png`
- `assets/pickleball-player.png`
- `assets/pickleball-doubles.png`
- `assets/pickleball-paddle-close.png`

No se usan imágenes externas de deporte. Las ligas, portadas, cards de clubs y fondos deportivos usan estas imágenes locales.

## Nuevo flujo de inscripciones

Este ZIP mantiene la app igual, pero añade el comportamiento pedido para diferenciar entre modo demo y una cuenta nueva registrada:

### Modo demo

- Al entrar con **Entrar en modo demo**, la app muestra todas las funciones completas:
  - Inicio
  - Mis partidos
  - Ligas
  - Mensajes
  - Descuentos
  - Perfil

### Cuenta creada desde registro

- Si creas una cuenta nueva desde **Crear cuenta**, la app no activa todavía la liga.
- La cuenta puede acceder a:
  - Ligas
  - Descuentos
  - Perfil
- Si intenta entrar en:
  - Mis partidos
  - Mensajes

  verá una pantalla de **Inscríbete a la liga**.

### Apartado Inscripciones

Desde la pantalla bloqueada se abre el nuevo apartado **Inscripciones**, con dos opciones:

1. **Liga de Verano en juego**
   - Aparece como liga ya iniciada.
   - Permite **Apuntarse como reserva**.
   - Al pulsar, muestra que se avisará cuando haya plaza.

2. **Liga de Invierno Pickleball**
   - Muestra **+400 jugadores inscritos**.
   - Permite elegir categoría y provincia.
   - Al pulsar **Pagar e inscribirme**, el pago es simulado.
   - Después se desbloquean las funciones de partidos y mensajes.
   - En **Mis partidos** aparecerá el estado **Próximamente**, indicando que el calendario se asignará cuando se cierre el grupo.

Todos los cambios siguen funcionando con `localStorage`; no hay backend ni pagos reales.

## Cambios de inscripción y nivelación

- La pestaña inferior **Descuentos** se ha sustituido por **Inscripción**.
- El apartado **Descuentos** sigue existiendo dentro de la app, pero ya no ocupa una pestaña inferior.
- Al crear una cuenta nueva, antes de entrar en la app aparece una **nivelación inicial** con 5 preguntas sobre fondo de pista, cocina, técnica, experiencia y táctica.
- Según las respuestas, la app asigna automáticamente un nivel inicial.
- Ese nivel se muestra en Perfil, Inscripciones y en los datos de liga necesarios.
- En la inscripción a la Liga de Invierno se usa el nivel asignado para colocar al jugador en el grupo correcto.
- El modo demo mantiene el acceso completo a todas las funciones como antes.
