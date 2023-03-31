const express = require('express');
const Joi = require('joi');
const ruta = express.Router();

const usuarios = [
  {id:1, nombre:'Juan'},
  {id:2, nombre:'Ana'},
  {id:3, nombre:'Miguel'},
  {id:4, nombre:'Maria'}
];

ruta.app.get('/',(req, res)=>{
  res.send(usuarios);
});

// Con los : delante del id
// Express sabe que es un parametro a recibir en la ruta
ruta.app.get('/:id',(req, res)=>{
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



// La ruta tiene el mismo nombre que la peticion GET
// Express hace la diferencia dependiendo del tipo de peticion.
// La peticion POST la vamos a utilizar para insertar 
// un nuevo usuario en nuestro arreglo.
ruta.app.post('/', (req, res)=>{
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
ruta.app.put('/:id', (req, res) => {
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
ruta.app.delete('/:id', (req,res) =>{
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

module.exports = ruta; // Se exporta el objeto ruta 