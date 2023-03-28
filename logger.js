function log(req, res, next){
  console.log('Logging...');
  next(); // Le indica a Espress que llame la siguiente funcion middleware
            // o la siguiente peticion correspondiente.
};

module.exports = log;