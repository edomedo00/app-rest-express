const inicioDebug = require('debug')('app:inicio'); // Importar el paquete debug
                                                    // El parametro indica el archivo 
                                                    // y el entorno de depuracion.

const dbDebug = require('debug')('app:db');  

const express = require('express'); // Importa el paquete express
const config = require('config'); // Importa el paquete config
const logger = require('./logger.js');
const morgan = require('morgan');
const Joi = require('joi');
const app = express(); // Crea una instancia de express

// Cuales son los metodos a implementar con su ruta
// app.get(); // Consulta
// app.post(); // Envio de datos al servidor (inserta datos en la bd)
// app.put(); // Actualizacion
// app.delete(); // Eliminacion

app.use(express.json()); // Le decimos a Espress que use este middleware

app.use(express.urlencoded({extended: true})); // Nuevo middleware
                                  // Define el uso de la libreria qs para
                                  // separar la informacion codificada
                                  // en url

app.use(express.static('public')); // Nombre de la carpeta que tendra
                                    // los archivos (recursos estaticos)

console.log(`App: ${config.get('nombre')}`);
console.log(`DB server: ${config.get('configDB.host')}`);

if(app.get('env')==='development'){ // lee qué archivo de configuración estamos 
                                    // utilizando y entonces habilita o deshabilita morgan
  app.use(morgan('tiny'));
  // Muestra el mensaje de depuracion 
  inicioDebug('Morgan habilitado.');
}

dbDebug('Conectado con la base de datos.');

// app.use(logger);

// app.use(function(req, res, next){
//   console.log('Autenticando...');
//   next(); 
// });

// Los 3 app.use() son middlewares y se llaman antes de 
// las funciones de ruta GET, POST, PUT, DELETE
// para que estas puedan trabajar

const usuarios = [
  {id:1, nombre:'Juan'},
  {id:2, nombre:'Ana'},
  {id:3, nombre:'Miguel'},
  {id:4, nombre:'Maria'}
];

function existe_usuario(id){
  return (usuarios.find(u => u.id === parseInt(id)));
}

function validarUsuario(nom){
  const schema = Joi.object({
    nombre: Joi 
      .string()
      .min(3)
      .required()
  });
  return (schema.validate({nombre:nom}));
}

// Consulta en la ruta raiz del sitio
// toda peticion va a recibir dos parametros (objetos)
// req: la informacion que recibe el servidor del cliente
// res: la informacion que el servidor va a responder al cliente
// Vamos a utilizar el metodo send del objeto res
app.get('/', (req, res)=>{
  res.send('Hola mundo');
});

app.get('/api/usuarios',(req, res)=>{
  res.send(usuarios);
});

// Con los : delante del id
// Express sabe que es un parametro a recibir en la ruta
app.get('/api/usuarios/:id',(req, res)=>{
  // En el cuerpo del objeto req esta la propiedad
  // params, que guarda los parametros enviados.
  // Los parametros en req. params se reciben como strings
  // parseInt, hace el casteo a valores enteros directamente
  const id = parseInt(req.params.id);
  // Devuelve el primer usuario que cumpla con el predicado
  const usuario = usuarios.find(u => u.id === id); 
  console.log(usuario); // Arroja undefined
  if(!usuario)
    res.status(404).send(`El usuario ${id} no se encuentra.`);
  res.send(usuario);
});

// Recibiendo varios parametros
// Se pasa n dos parametros year y month
// Query string
// localhost:4000/api/usuarios/1990/2/?nombre=xxx&single=y
app.get('/api/usuarios/:year/:month', (req, res) => {
  // En el cuerpo de req esta la propiedad
  // query, que guarda los parametros Query String.
  // console.log(req.params);
  res.send(req.query);
});
// Si me dirijo a: 
// http://localhost:4000/api/usuarios/1990/12/?nombre=Edmundo&single=true
// Arroja: {"nombre":"Edmundo","single":"true"}
// usando re.query en el send


// La ruta tiene el mismo nombre que la peticion GET
// Express hace la diferencia dependiendo del tipo de peticion.
// La peticion POST la vamos a utilizar para insertar 
// un nuevo usuario en nuestro arreglo.
app.post('/api/usuarios/', (req, res)=>{
  // El objeto request tiene la propiedad body
  // que va a venir en formato JSON
  // Creacion del schema con Joi
  const schema = Joi.object({
    nombre: Joi
      .string()
      .min(3)
      .required()
  });
  
  // Esta es una forma de hacerlo dentro de la peticion
  // En la peticion PUT se utilizan funciones para organizar mejor 
  // el codigo.
  const {error, value} = schema.validate({nombre: req.body.nombre});
  if (!error){
    const usuario = {
    id: usuarios.length + 1, 
      nombre: req.body.nombre
    };
    usuarios.push(usuario);
    res.send(usuario);
  } else {
    const mensaje = error.details[0].message;
    res.status(400).send(mensaje);
  }
  return;

  // Forma de hacer validaciones sin Joi
  // if(!req.body.nombre ||  req.body.nombre.length <= 2){
  //   // Codigo 400: Bad request
  //   res.status(400).send('Debe ingresar un nombre que tenga al menos 3 letras.');
  //   return; // Es necesario para que no continue con el metodo
  // }

  // const usuario = {
  //   id: usuarios.length + 1, 
  //   nombre: req.body.nombre
  // };
  // usuarios.push(usuario);
  // res.send(usuario);
});

// Peticion para modificar datos existentes
// Este método debe recibir un parámetro
// id para saber qué usuario modificar.
app.put('/api/usuarios/:id', (req, res) => {
  // Encontrar si existe el usuario a modificar
  let usuario = existe_usuario(req.params.id); 
  // Devuelve el usuario si existe y si no devuelve undefined
  if(!usuario){
    res.status(404).send('El usuario no se encuentra.'); // Devuelve el estado HTTP
  }
  // Validar si el dato recibido es correcto
  const {error, value} = validarUsuario(req.body.nombre);
  if(!error){
    // Actualiza el nombre 
    usuario.nombre = value.nombre;
    res.send(usuario);
  }
  else {
    const mensaje = error.details[0].message;
    res.status(400).send(mensaje);
  }
  return;
});

// Recibe como parámetro el id del usuario 
// que se va a eliminar
app.delete('/api/usuarios/:id', (req,res) =>{
  const usuario = existe_usuario(req.params.id);
  if (!usuario){
    res.status(404).send('El usuario no se encuentra');
    return;
  } 
  // Encontrar el indice del usuario dentro del arreglo
  const index = usuarios.indexOf(usuario);
  usuarios.splice(index,1); // Elimina el usuario en el indice
  res.send(usuario); // Responde con el usuario eliminado
  return;
});

app.get('/api/productos',(req, res)=>{
  res.send(['mouse', 'teclado', 'bocinas']);
});

// El modulo process contiene informacion del sistema 
// El objeto env contiene informacion de las variables
// de entorno.
// Si la variable port no existe, tomara un valor definido
// por nosotros.
const port = process.env.PORT || 4000;

app.listen(port, ()=>{
  console.log(`Escuchando en el puerto ${port}`);
});

// ------- Funciones middleware ---------
// El middleware es un bloque de código que se ejecuta
// entre las peticiones del usuario (request) y la petición
// que llega al servidor. Es un enlace entre la petición 
// del usuario y del servidor, antes de que este pueda
// dar una respuesta.

// Las funciones de middleware son funciones que tienen acceso
// al objeto de solicitud (req), al objeto de respuesta (res)
// y a la siguiente función de middleware en el ciclo de 
// solicitud/respuesta de la aplicación. La siguiente función 
// de middleware se denota normalmente con una variable
// denominada next.

// Las funciones de middleware pueden realizar las siguientes tareas:

//    - Ejecutar cualquier código
//    - Realizar cambios en la solicitud y los objetos de respuesta
//    - Finalizar el ciclo de solicitud/respuesta
//    - Invoca la siguiente función de middleware en la pila

// Express es un framework de direccionamiento y uso de middleware
// que permite que la aplicación tenga funcionalidad mínima propia.

// Ya hemos utilizado algunos middleware como son express.json()
// que transforma el body del req a formato JSON

//            -------------------------
// request --|--> json() --> route() --|--> response
//            -------------------------

// route() --> función GET, POST, PUT, DELETE

// Una aplicación Express puede utilizar los siguientes tipos de middleware
//    - Middleware de ivel de aplicación
//    - Middleware de nivel de direccionador
//    - Middleware de manejo de errores
//    - Middleware incorporado
//    - Middleware de terceros


// ------- Recursos Estáticos ---------
// Los recursos estáticos hacen referencia a archivos,
// imágenes, documentos que se ubican en el servidor.
// Vamos a usar un middleware para poder acceder a esos
// 