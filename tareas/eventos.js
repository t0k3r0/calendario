import { mostrarNotificacion } from "./tareas.js";
const ipsJoseba = ["192.168.1.110", "192.168.1.120", "192.168.1.130", "192.168.1.140", "192.168.1.150"];
const ipsMacarena = ["192.168.1.50", "192.168.1.60", "192.168.1.70", "192.168.1.80", "192.168.1.90"];
export function obtenerEventos(fecha, celdaContenidoId, callback) {
  fetch(`./tareas/eventos.php?fecha=${encodeURIComponent(fecha)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error en la respuesta del servidor");
      }
      return response.json();
    })
    .then((data) => {
      if (celdaContenidoId) {
        const celdaContenido = document.getElementById(celdaContenidoId);
        if (celdaContenido) {
          const dchaDiv = celdaContenido.querySelector(".derecha");
          if (dchaDiv) {
            dchaDiv.innerHTML = "";
            if (data.length > 0) {
              data.forEach((evento) => {
                const eventoDiv = document.createElement("div");
                eventoDiv.className = "evento";
                eventoDiv.innerText = `${evento.titulo}`;
                if (ipsJoseba.includes(evento.ip)) {
                  eventoDiv.style.color = 'blue';
                }
                else if (ipsMacarena.includes(evento.ip)) {
                  eventoDiv.style.color = '#ff1493';
                }
                eventoDiv.onclick = () => mostrarPopup(evento);
                dchaDiv.appendChild(eventoDiv);
              });
            }
          }
        }
      }
      if (callback) {
        callback(data);
      }
    })
    .catch((error) => console.error("Error obteniendo eventos:", error));
}
export function mostrarPopup(evento) {
  const popup = document.createElement("div");
  popup.id = "popup";
  popup.className = "popup";
  const popupContenido = document.createElement("div");
  popupContenido.id = "popup-contenido";
  popupContenido.innerHTML = `
    <h3>${evento.titulo}</h3>
    <p>Hora: ${evento.hora}</p>
    <button id="eliminar-${evento.id}">Eliminar</button>
    <button onclick="cerrarPopup()">Cerrar</button>
  `;
  popup.appendChild(popupContenido);
  document.body.appendChild(popup);
  console.log("Popup creado con el contenido:", popupContenido.innerHTML);
  const eliminarBtn = document.getElementById(`eliminar-${evento.id}`);
  if (eliminarBtn) {
    eliminarBtn.addEventListener("click", () => eliminarEvento(evento.id));
    console.log("BotÃ³n eliminar encontrado y manejador asignado.");
  } else {
    console.error("BotÃ³n eliminar no encontrado.");
  }
  popup.style.display = "block";
}
export function crearEvento(texto, fecha, hora) {
  fetch("./tareas/eventos.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `titulo=${encodeURIComponent(texto)}&fecha=${encodeURIComponent(
      fecha
    )}&hora=${encodeURIComponent(hora)}`,
  })
    .then((response) => {
      if (!response.ok) {
        mostrarNotificacion("Error en la respuesta del servidor al crear el evento", "red");
        throw new Error("Error en la respuesta del servidor");
      }
      return response.json();
    })
    .then((data) => {
      actualizarEventos();
    })
    .catch((error) => console.error("Error creando evento:", error));
}
export function eliminarEvento(id, callback) {
  if (typeof id === "undefined" || id === null) {
    console.error("ID no definido");
    return;
  }
  fetch("./tareas/eventos.php", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `id=${encodeURIComponent(id)}`,
  })
    .then((response) => {
      if (!response.ok) {
        mostrarNotificacion("Error en la respuesta del servidor al eliminar el evento", "red");
        throw new Error("Error en la respuesta del servidor");
      }
      mostrarNotificacion("Evento eliminado exitosamente", "green");
      return response.json();
    })
    .then((data) => {
      console.log("Respuesta del servidor:", data);
      if (callback) {
        callback();
      }
      actualizarEventos();
    })
    .catch((error) => console.error("Error eliminando evento:", error));
}
export function actualizarEventos() {
  document.querySelectorAll("td").forEach((td) => {
    const celdaId = td.id;
    const fechaMatch = celdaId.match(/dia-(\d+)-(\d+)/);
    if (fechaMatch) {
      const mesIndex = parseInt(fechaMatch[1], 10) - 1;
      const diaNumero = parseInt(fechaMatch[2], 10);
      const yearActual = new Date().getFullYear();
      const mesActual = new Date().getMonth();
      const yearForMonth = mesIndex + 1 < mesActual ? yearActual + 1 : yearActual;
      if (mesIndex >= 0 && mesIndex < 12) {
        const fecha = `${yearForMonth}-${(mesIndex + 1)
          .toString()
          .padStart(2, "0")}-${diaNumero.toString().padStart(2, "0")}`;
        obtenerEventos(fecha, td.querySelector(".celda-contenido").id);
      }
    }
  });
}
