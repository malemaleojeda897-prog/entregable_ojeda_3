console.log("JS funcionando");

// VARIABLES
let servicios = [];
let servicioSeleccionado = null;
let fechaSeleccionada = null;
let horarioSeleccionado = null;
let sinTurnosDisponibles = false;

// JSON SERVICIOS
const serviciosJSON = [
  { id: 1, nombre: "Capping gel", precio: 15000, img: "test.js/img/capping.jpg" },
  { id: 2, nombre: "Semipermanente", precio: 10000, img: "test.js/img/semipermanente.jpg" },
  { id: 3, nombre: "Softgel", precio: 20000, img: "test.js/img/softgel.jpg" }
];

// PROMESA
function obtenerServicios() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(serviciosJSON), 500);
  });
}

// CARGAR SERVICIOS
async function cargarServicios() {
  servicios = await obtenerServicios();
  mostrarServicios();
}

// MOSTRAR SERVICIOS
function mostrarServicios() {
  const contenedor = document.getElementById("servicios");

  servicios.forEach(servicio => {
    const div = document.createElement("div");
    div.classList.add("card");

    div.innerHTML = `
      <h3>${servicio.nombre}</h3>
      <img src="${servicio.img}">
      <p>$${servicio.precio}</p>
    `;

    div.addEventListener("click", () => {
      servicioSeleccionado = servicio;
      document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
      div.classList.add("selected");
    });

    contenedor.appendChild(div);
  });
}

// CALENDARIO
flatpickr("#calendario", {
  minDate: "today",
  disable: [(date) => date.getDay() === 1 || date.getDay() === 4],
  onChange: function(selectedDates) {
    fechaSeleccionada = selectedDates[0];
    mostrarHorarios();
  }
});

// HORARIOS
const horariosBase = ["10:00", "13:00"];

function mostrarHorarios() {
  const contenedor = document.getElementById("horarios");
  contenedor.innerHTML = "";

  const turnosGuardados = JSON.parse(localStorage.getItem("turnos")) || [];

  const horariosDisponibles = horariosBase.filter(hora => {
    return !turnosGuardados.some(turno =>
      turno.fecha === fechaSeleccionada.toDateString() && turno.hora === hora
    );
  });

  if (horariosDisponibles.length === 0) {
    contenedor.innerHTML = "No hay turnos disponibles para esta fecha";
    sinTurnosDisponibles = true;
    return;
  }

  sinTurnosDisponibles = false;

  horariosDisponibles.forEach(hora => {
    const btn = document.createElement("button");
    btn.textContent = hora;

    btn.addEventListener("click", () => {
      horarioSeleccionado = hora;
      document.querySelectorAll("#horarios button").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
    });

    contenedor.appendChild(btn);
  });
}

// CONFIRMAR TURNO
document.getElementById("confirmar").addEventListener("click", () => {

  if (sinTurnosDisponibles) {
    Swal.fire("No hay turnos disponibles");
    return;
  }

  if (!servicioSeleccionado || !fechaSeleccionada || !horarioSeleccionado) {
    Swal.fire("Falta completar datos");
    return;
  }

  const turno = {
    servicio: servicioSeleccionado.nombre,
    fecha: fechaSeleccionada.toDateString(),
    hora: horarioSeleccionado
  };

  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  const alias = "maleojeda.mp";
  const telefono = "5491137989228";

  const mensaje = `Hola! Reservé un turno
Servicio: ${turno.servicio}
Fecha: ${turno.fecha}
Hora: ${turno.hora}
Ya envié la seña de $2000 al alias ${alias}`;

  const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  Swal.fire({
    title: "Turno reservado 💅",
    html: `<b>${turno.servicio}</b><br>${turno.fecha} ${turno.hora}`,
    showCancelButton: true,
    confirmButtonText: "Enviar WhatsApp"
  }).then((r) => {
    if (r.isConfirmed) window.open(urlWhatsApp, "_blank");
  });

  // RESET
  servicioSeleccionado = null;
  fechaSeleccionada = null;
  horarioSeleccionado = null;
  document.getElementById("calendario").value = "";
  document.getElementById("horarios").innerHTML = "";
  document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
});

// CLIENTE BORRA TURNO
function cancelarTurnoCliente() {

  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  if (turnos.length === 0) {
    Swal.fire("No tenés turnos");
    return;
  }

  let opciones = {};
  turnos.forEach((t, i) => {
    opciones[i] = `${t.servicio} - ${t.fecha} ${t.hora}`;
  });

  Swal.fire({
    title: "Seleccioná el turno a cancelar",
    input: "select",
    inputOptions: opciones,
    inputPlaceholder: "Elegí un turno",
    showCancelButton: true,
    confirmButtonText: "Cancelar turno"
  }).then(result => {
    if (result.isConfirmed) {
      let index = result.value;

      turnos.splice(index, 1);
      localStorage.setItem("turnos", JSON.stringify(turnos));

      Swal.fire("Turno cancelado correctamente");
      mostrarHorarios();
    }
  });
}

// ADMIN BORRA TURNO 
function adminTurnos() {

  Swal.fire({
    title: "Clave de administrador",
    input: "password",
    inputPlaceholder: "Ingresá la clave",
    showCancelButton: true
  }).then(res => {

    if (!res.isConfirmed) return;

    if (res.value !== "1234") {
      Swal.fire("Clave incorrecta");
      return;
    }

    let turnos = JSON.parse(localStorage.getItem("turnos")) || [];

    if (turnos.length === 0) {
      Swal.fire("No hay turnos");
      return;
    }

    let opciones = {};
    turnos.forEach((t, i) => {
      opciones[i] = `${t.servicio} - ${t.fecha} ${t.hora}`;
    });

    Swal.fire({
      title: "Panel Admin",
      input: "radio",
      inputOptions: {
        uno: "Eliminar un turno",
        todos: "Eliminar TODOS"
      },
      showCancelButton: true
    }).then(eleccion => {

      if (!eleccion.isConfirmed) return;

      if (eleccion.value === "todos") {
        localStorage.removeItem("turnos");
        Swal.fire("Todos los turnos eliminados");
      }

      if (eleccion.value === "uno") {
        Swal.fire({
          title: "Elegí turno a borrar",
          input: "select",
          inputOptions: opciones,
          showCancelButton: true
        }).then(sel => {

          if (!sel.isConfirmed) return;

          turnos.splice(sel.value, 1);
          localStorage.setItem("turnos", JSON.stringify(turnos));

          Swal.fire("Turno eliminado");
        });
      }
    });
  });
}

// INICIO
cargarServicios();
