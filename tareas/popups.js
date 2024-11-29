import { obtenerEventos, crearEvento, eliminarEvento } from "./eventos.js";
import { mostrarNotificacion } from "./tareas.js";
let popupAbierto = null;
const ipsJoseba = ["192.168.1.110", "192.168.1.120", "192.168.1.130", "192.168.1.140", "192.168.1.150"];
const ipsMacarena = ["192.168.1.50", "192.168.1.60", "192.168.1.70", "192.168.1.80", "192.168.1.90"];
export function agregarPopupsACeldas() {
  document.querySelectorAll("td").forEach((td) => {
    if (!td.classList.contains("empty-cell")) {
      td.addEventListener("click", (e) => {
        if (popupAbierto) {
          document.body.removeChild(popupAbierto);
          popupAbierto = null;
        }
        const fechaMatch = td.id.match(/dia-(\d+)-(\d+)/);
        if (fechaMatch) {
          const mesIndex = parseInt(fechaMatch[1], 10) - 1;
          const diaNumero = parseInt(fechaMatch[2], 10);
          const yearActual = new Date().getFullYear();
          const mesActual = new Date().getMonth();
          const year = mesIndex < mesActual ? yearActual + 1 : yearActual;
          const fecha = `${year}-${(mesIndex + 1)
            .toString()
            .padStart(2, "0")}-${diaNumero.toString().padStart(2, "0")}`;
          obtenerEventos(fecha, null, (eventos) => {
            const popup = document.createElement("div");
            popup.className = "event-popup";
            popup.innerHTML = `<h4>${formatearFecha(fecha)}</h4>`;
            const eventosList = document.createElement("ul");
            eventosList.className = "eventos-list";
            if (eventos.length > 0) {
              eventos.forEach((evento) => {
                const listItem = document.createElement("li");
                listItem.className = "event-item";
                const horaSpan = document.createElement("span");
                horaSpan.className = "event-hora";
                horaSpan.innerText = evento.hora.substring(0, 5);
                const tituloSpan = document.createElement("span");
                tituloSpan.className = "event-titulo";
                tituloSpan.innerText = evento.titulo;
                // Cambia el color a azul si la IP es "192.168.1.140"
                if (ipsJoseba.includes(evento.ip)) {
                  listItem.style.color = 'blue'; // Aplicar color azul a todo el Ã­tem
                }
                else if (ipsMacarena.includes(evento.ip)) {
                  listItem.style.color = '#ff1493'; // Aplicar color azul a todo el Ã­tem
                }
                const deleteButton = document.createElement("button");
                deleteButton.innerText = "Eliminar";
                deleteButton.className = "delete-button";
                deleteButton.onclick = (e) => {
                  e.stopPropagation();
                  eliminarEvento(evento.id, () => {
                    eventosList.removeChild(listItem);
                    if (eventosList.children.length === 0) {
                      const noEventItem = document.createElement("li");
                      noEventItem.innerText = "Sin eventos";
                      eventosList.appendChild(noEventItem);
                    }
                  });
                };
                listItem.appendChild(horaSpan);
                listItem.appendChild(tituloSpan);
                listItem.appendChild(deleteButton);
                eventosList.appendChild(listItem);
              });
            } else {
              const noEventItem = document.createElement("li");
              noEventItem.innerText = "Sin eventos";
              eventosList.appendChild(noEventItem);
            }
            popup.appendChild(eventosList);
            const inputContainer = document.createElement("div");
            inputContainer.className = "input-row";
            const horaInput = document.createElement("input");
            horaInput.type = "time";
            horaInput.className = "event-time";
            horaInput.value = "09:00";
            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Agregar evento";
            input.className = "event-input";
            input.maxLength = 20;
            inputContainer.appendChild(horaInput);
            inputContainer.appendChild(input);
            popup.appendChild(inputContainer);
            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "flex";
            buttonContainer.style.justifyContent = "space-between";
            buttonContainer.style.marginTop = "10px";
            const addButton = document.createElement("button");
            addButton.innerText = "Agregar";
            addButton.className = "event-button";
            addButton.onclick = () => {
              const nuevoEvento = input.value.trim();
              const nuevaHora = horaInput.value.trim();
              if (nuevoEvento && nuevaHora) {
                const numeroItemsAntes = eventosList.children.length;
                crearEvento(nuevoEvento, fecha, nuevaHora);
                input.value = "";
                horaInput.value = "09:00";
                obtenerEventos(fecha, null, (eventosActualizados) => {
                  eventosList.innerHTML = "";
                  if (eventosActualizados.length > 0) {
                    if (eventosActualizados.length === numeroItemsAntes) {
                      // LÃ³gica para repetir la consulta
                      setTimeout(() => {
                        obtenerEventos(fecha, null, (eventosReintentados) => {
                          eventosList.innerHTML = ""; // Limpia la lista nuevamente
                          eventosReintentados.forEach((evento) => {
                            const retryListItem = document.createElement("li");
                            retryListItem.innerText = `${evento.hora.substring(
                              0,
                              5
                            )} - ${evento.titulo}`;
                            if (ipsJoseba.includes(evento.ip)) {
                              updatedListItem.style.color = 'blue'; // Aplicar color azul a todo el Ã­tem
                            }
                            else if (ipsMacarena.includes(evento.ip)) {
                              updatedListItem.style.color = '#ff1493'; // Aplicar color azul a todo el Ã­tem
                            }
                            const retryDeleteButton =
                              document.createElement("button");
                            retryDeleteButton.innerText = "Eliminar";
                            retryDeleteButton.className = "delete-button";
                            retryDeleteButton.onclick = (e) => {
                              e.stopPropagation();
                              eliminarEvento(evento.id, () => {
                                eventosList.removeChild(retryListItem);
                                if (eventosList.children.length === 0) {
                                  const noEventItem =
                                    document.createElement("li");
                                  noEventItem.innerText = "Sin eventos";
                                  eventosList.appendChild(noEventItem);
                                }
                              });
                            };
                            retryListItem.appendChild(retryDeleteButton);
                            eventosList.appendChild(retryListItem);
                          });
                        });
                      },200); // Reintenta despuÃ©s de 2 decimas de segundo
                    } else {
                      eventosActualizados.forEach((evento) => {
                        const updatedListItem = document.createElement("li");
                        updatedListItem.innerText = `${evento.hora.substring(
                          0,
                          5
                        )} - ${evento.titulo}`;
                        // console.log(evento.ip)
                        if (ipsJoseba.includes(evento.ip)) {
                          updatedListItem.style.color = 'blue'; // Aplicar color azul a todo el Ã­tem
                        }
                        else if (ipsMacarena.includes(evento.ip)) {
                          updatedListItem.style.color = '#ff1493'; // Aplicar color azul a todo el Ã­tem
                        }
                        const updatedDeleteButton =
                          document.createElement("button");
                        updatedDeleteButton.innerText = "Eliminar";
                        updatedDeleteButton.className = "delete-button";
                        updatedDeleteButton.onclick = (e) => {
                          e.stopPropagation();
                          eliminarEvento(evento.id, () => {
                            eventosList.removeChild(updatedListItem);
                            if (eventosList.children.length === 0) {
                              const noEventItem = document.createElement("li");
                              noEventItem.innerText = "Sin eventos";
                              eventosList.appendChild(noEventItem);
                            } else {
                            }
                          });
                        };
                        updatedListItem.appendChild(updatedDeleteButton);
                        eventosList.appendChild(updatedListItem);
                        mostrarNotificacion("Evento agregado existosamente", "green");
                      });
                    }
                  } else {
                    const noEventItem = document.createElement("li");
                    noEventItem.innerText = "Sin eventos";
                    eventosList.appendChild(noEventItem);
                  }
                });
              } else {
                mostrarNotificacion("Alguno de los campos estÃ¡ vacÃ­o", "red");
              }
            };
            const closeButton = document.createElement("button");
            closeButton.innerText = "Cerrar";
            closeButton.onclick = () => {
              document.body.removeChild(popup);
              popupAbierto = null;
            };
            buttonContainer.appendChild(addButton);
            buttonContainer.appendChild(closeButton);
            popup.appendChild(buttonContainer);
            document.body.appendChild(popup);
            popup.style.position = "fixed";
            popup.style.left = "50%";
            popup.style.top = "50%";
            popup.style.transform = "translate(-50%, -50%)";
            popup.style.backgroundColor = "#fff";
            popup.style.border = "1px solid #333";
            popup.style.padding = "20px";
            popup.style.zIndex = "1001";
            popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            popup.style.maxWidth = "400px";
            input.focus();
            const enterListener = (e) => {
              if (e.key === "Enter") {
                addButton.click();
              }
            };
            input.addEventListener("keypress", enterListener);
            horaInput.addEventListener("keypress", enterListener);
            popup.style.whiteSpace = "nowrap";
            popupAbierto = popup;
            document.addEventListener(
              "click",
              function cerrarPopupFuera(event) {
                if (
                  popupAbierto &&
                  !popup.contains(event.target) &&
                  event.target !== td
                ) {
                  if (document.body.contains(popup)) {
                    document.body.removeChild(popup);
                  }
                  popupAbierto = null;
                  document.removeEventListener("click", cerrarPopupFuera);
                }
              },
              { once: true }
            );
          });
        }
      });
    }
  });
}
function formatearFecha(fecha) {
  const opciones = { year: "numeric", month: "long", day: "numeric" };
  return new Date(fecha).toLocaleDateString("es-ES", opciones);
}
