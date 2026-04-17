console.log("JS funcionando");

// VARIABLES
let servicios = [];
let servicioSeleccionado = null;
let fechaSeleccionada = null;
let horarioSeleccionado = null;
let sinTurnosDisponibles = false;
let turnoPendiente = null;


// fetch con json
fetch("js/servicios.json")
  .then(res => res.json())
  .then(data => {
    servicios = data;
    mostrarServicios();
  });


// MOSTRAR SERVICIOS
function mostrarServicios() {
  const contenedor = document.getElementById("servicios");
  contenedor. innerHTML = ""; 

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

  const nombre = document.getElementById("nombre").value.trim();
 if (!nombre){
  swal.fire("ingresa tu nombre");
  return;
 }
 
 //turno pendiente
 turnoPendiente = {
  nombre, 
  servicio: servicioSeleccionado.nombre,
  precio: servicioSeleccionado.precio, 
  fecha: fechaSeleccionada.toDateString(),
    hora: horarioSeleccionado
  };

  mostrarConfirmacion(turnoPendiente);
});

//confirmacion de costo
 function mostrarConfirmacion(turno) {

  const seña = 2000;
  const restante = turno.precio - seña;

  Swal.fire({
    title: "Confirmar turno",
    html: `
      <p><b>${turno.nombre}</b></p>
      <p>${turno.servicio}</p>
      <p>${turno.fecha} - ${turno.hora}</p>
      <p>Precio total: $${turno.precio}</p>
      <p>Seña: $${seña}, alias: maleojeda.mp </p> 
      <p><b>Restante a pagar del total: $${restante}</b></p>
    `,
    showCancelButton: true,
    confirmButtonText: "Confirmar y reservar",
    cancelButtonText: "Cancelar"
  }).then((r) => {

    if (!r.isConfirmed) {
      turnoPendiente = null;
      return;
    }

    guardarTurno();
  });
}

// guardar y enviar a wsp

function guardarTurno() {

  if (!turnoPendiente) return;

  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  turnos.push(turnoPendiente);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  const alias = "maleojeda.mp";
  const telefono = "5491137989228";

  const mensaje = `Hola! Soy ${turnoPendiente.nombre}
Reservé un turno:
Servicio: ${turnoPendiente.servicio}
Fecha: ${turnoPendiente.fecha}
Hora: ${turnoPendiente.hora}
Ya envié la seña de $2000 al alias ${alias}`;

  const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

  Swal.fire({
    title: "Turno reservado",
    html: `
      <p><b>${turnoPendiente.nombre}</b></p> 
      <p>${turnoPendiente.servicio}</p>
      <p>${turnoPendiente.fecha} ${turnoPendiente.hora}</p>
      <p style= "margin-top:10px;">
      Recorda enviar el comprobante de pago por WhatsApp para confirmar tu turno.
      </p>
      `,
    showCancelButton: false,
    confirmButtonText: "Enviar WhatsApp",
  }).then((r) => {
    if (r.isConfirmed) window.open(urlWhatsApp, "_blank");
  });

 
  // RESET
  turnoPendiente = null;
  servicioSeleccionado = null;
  fechaSeleccionada = null;
  horarioSeleccionado = null;
  document.getElementById("calendario").value = "";
  document.getElementById("horarios").innerHTML = "";
  document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
};

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

