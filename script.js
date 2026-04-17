// ==========================================
// 1. CONFIGURACIÓN SUPABASE (Ofuscación Hexadecimal)
// ==========================================
const SB_URL = 'https://fetqdwxjgwqveqpxlkdo.supabase.co'; 

// La llave Base64 convertida a pares hexadecimales (asusta a la vista)
const hexKey = "5a586c4b61474a4859326c506155704a5658704a4d55357053584e4a626c493159304e4a4e6b6c726346685751306f354c6d5635536e426a4d30317054326c4b656d5259516d685a62555a36576c4e4a63306c75536d7861615532535357313662456449526d746b4d326878576a4e6b65475274566e686a5347687a59544a53646b6c7064326c6a62546c7a576c4e4a4e6b6c74526e56694d6a527054454e4b63466c5955576c50616b557a546e7052655539455a7a4a505647647a535731574e474e4453545a4e616b45305431526e4d6b354557545650534441754c57553053304a594d6c466e53456c6d5a304d324d6d3543614731354d7a42614d456c784d6c4e7a61314674596b6378533073745557687253513d3d";

// Función que decodifica de Hexadecimal a Texto en memoria
function fromHex(hexStr) {
    let str = '';
    for (let i = 0; i < hexStr.length; i += 2) {
        str += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
    }
    return str;
}

// Reconstruimos la llave y conectamos
const supabaseKey = atob(fromHex(hexKey));
const db = window.supabase.createClient(SB_URL, supabaseKey);

// ==========================================
// 2. LÓGICA DE LA VENTANA EMERGENTE (MODAL)
// ==========================================
const modal = document.getElementById("modalRegistro");
const btn = document.getElementById("btnRegistro");
const span = document.querySelector(".close");

// Abrir el modal
if (btn) {
    btn.onclick = () => {
        modal.style.display = "block";
    };
}

// Cerrar el modal con la tachita
if (span) {
    span.onclick = () => {
        modal.style.display = "none";
    };
}

// Cerrar el modal dando clic afuera
window.onclick = (e) => {
    if (e.target == modal) {
        modal.style.display = "none";
    }
};

// Cambiar el texto del input dependiendo si es Alumno o Profesor [cite: 37, 82, 85]
function actualizarPlaceholder() {
    const tipo = document.getElementById('tipo').value;
    const inputId = document.getElementById('id_esc');
    
    if (tipo === 'alumno') {
        inputId.placeholder = "Número de Boleta";
    } else {
        inputId.placeholder = "Número de Empleado";
    }
}

// ==========================================
// 3. CARGAR LIBROS DESDE LA BASE DE DATOS
// ==========================================
async function cargarLibros() {
    const grid = document.getElementById('bookGrid');
    if (!grid) return;

    // Traemos los datos de la Entidad Fuerte 'libros' [cite: 134, 183]
    const { data: libros, error } = await db.from('libros').select('*');

    if (error) {
        console.error("Error al cargar libros:", error.message);
        grid.innerHTML = `<p style="color:#ef4444;">Error de conexión con la base de datos.</p>`;
        return;
    }

    if (!libros || libros.length === 0) {
        grid.innerHTML = `<p style="color:#94a3b8;">El catálogo está vacío. Agrega libros desde Supabase.</p>`;
        return;
    }

    // Dibujar los libros en el HTML
    grid.innerHTML = libros.map(libro => `
        <div class="book-card">
            <div class="book-img">${libro.emoji || '📖'}</div>
            <div class="book-info">
                <h4>${libro.titulo}</h4>
                <span><strong>${libro.autor}</strong></span>
                <p style="color:#64748b; font-size:0.8rem; margin-top:5px;">${libro.genero || 'General'}</p>
                <button class="btn-primary" style="width:100%; margin-top:15px; padding:10px; font-size:0.8rem;">
                    Solicitar Préstamo
                </button>
            </div>
        </div>
    `).join('');
}

// ==========================================
// 4. REGISTRO DE USUARIOS (MODELO EER)
// ==========================================
document.getElementById('regForm').onsubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    // Capturar los datos del formulario
    const curp = document.getElementById('curp').value;
    const nombre = document.getElementById('nombre').value;
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const tipo = document.getElementById('tipo').value;
    const id_escolar = document.getElementById('id_esc').value;

    try {
        // A. Registrar en la Autenticación de Supabase
        const { data: authData, error: authError } = await db.auth.signUp({
            email: `${user}@escom.ipn.mx`,
            password: pass,
        });

        if (authError) throw authError;

        // B. Insertar en la tabla SUPERTIPO (profiles) [cite: 78, 189]
        const { error: profileError } = await db.from('profiles').insert([{ 
            id: authData.user.id, 
            curp: curp, 
            nombre_completo: nombre, 
            username: user, 
            tipo: tipo 
        }]);

        if (profileError) throw profileError;

        // C. Insertar en la tabla SUBTIPO (alumnos o profesores) [cite: 80, 84, 190]
        const tabla = tipo === 'alumno' ? 'alumnos' : 'profesores';
        const colId = tipo === 'alumno' ? 'boleta' : 'no_empleado';

        const { error: subTypeError } = await db.from(tabla).insert([{ 
            id: authData.user.id, 
            [colId]: id_escolar 
        }]);

        if (subTypeError) throw subTypeError;

        // Éxito
        alert("¡Registro exitoso! Ya eres parte de la comunidad.");
        modal.style.display = "none";
        document.getElementById('regForm').reset(); // Limpiar el formulario
        
    } catch (err) {
        alert("Error al registrar: " + err.message);
        console.error("Detalle del error:", err);
    }
};

// Función vacía para evitar el ReferenceError del botón de buscar
function buscarLibro() {
    alert("Función de búsqueda en desarrollo...");
}

// Ejecutar la carga de libros en cuanto el HTML esté listo
document.addEventListener('DOMContentLoaded', () => {
    cargarLibros();
    // Asegurarnos de que el placeholder esté correcto al cargar
    actualizarPlaceholder();
});
