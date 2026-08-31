# Registro de versiones

## v2.1 — pedido en mesa y para llevar

Punto estable. Commit `d183190`.

**La carta.** 95 platos en 15 secciones, cuatro idiomas (es · it · en · de).
En el móvil, foto a todo el ancho con deriva al desplazar; en el escritorio,
rejilla. Menú del día que se arma solo cada día y banda de novedades aparte.
Filtro de alérgenos que se recuerda entre visitas, buscador que indexa los
cuatro idiomas a la vez e ignora acentos, abierto/cerrado calculado en vivo
desde los horarios, modo claro/oscuro, y funciona sin conexión.

**El pedido.** La cesta se envía por WhatsApp y hay dos clases:

- **En mesa.** Solo si la carta se abrió desde el QR de esa mesa
  (`?mesa=S1`). El botón dice «Enviar pedido a cocina» y el mensaje empieza
  por la mesa. El número no se puede escribir a mano: se enseña como sello.
- **Para llevar.** Sin mesa. El botón dice «Enviar pedido para llevar» y el
  mensaje pide hora de recogida.

El mensaje llega **siempre en español**, lea el cliente la carta en el idioma
que la lea, con el nombre del plato en su idioma entre paréntesis y una línea
diciendo qué idioma habla.

**Los códigos QR.** Uno general para la puerta y la barra, y 23 de mesa
(S1-S11 salón, T1-T12 terraza), cada uno con su número sellado en el centro y
color por zona. El generador lee de vuelta los 23 y verifica que apuntan a su
mesa antes de dejar imprimir nada.

**Comprobado.** `npm run check` valida datos y caché offline y bloquea el
despliegue; `npm run test` hace 24 comprobaciones en un navegador de verdad.

Publicado en <https://straycoderx.github.io/PastaYGofio/>.

### Pendiente

- Confirmar en cocina los alérgenos de los platos nuevos: queso a la plancha,
  tequeños y lomo alto están declarados por analogía.
- Decir cuál de las dos lasañas muestra el cartel «Nueva lasaña casera», para
  poder usar esa foto.
- Fotos: 49 de las 52 no llegan a 600 px de ancho y a pantalla completa se ven
  blandas. Las dos más justas, las tablas de quesos (236 px).
- El logotipo (`assets/img/logo.svg`) es una reproducción; falta el original.
