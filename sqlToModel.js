var fs = require('fs');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Ingrese nombre de la tabla que se va a mappear: ', (answer) => {

    sqlTableToArrayString(answer);

    rl.close();
});


    
    // Auxiliares
    const upperFirstLetter = (elString) => {
        return elString.charAt(0).toUpperCase() + elString.slice(1);
    }

    /**
     * Por ahora esta configurado para facutracion
     */
    const sqlTableToArrayString = (nombreTabla) => {
        var mysql      = require('mysql');
        var connection = mysql.createConnection({
            host     : 'localhost',
            user     : 'root',
            password : 'Humb3rt01',
            database : 'dbFacturacion'
        });

        connection.connect();

        let jsKeys = [];

        return connection.query(`SHOW CREATE TABLE dbFacturacion.${nombreTabla};`, (error, results, fields) => {
            if (error) throw error;
            let consultaCreate = results[0]['Create Table'];

            let pseudoKeys = consultaCreate
                        .substring(consultaCreate.indexOf('CREATE TABLE') + 13, consultaCreate.indexOf('PRIMARY KEY'))
                        .split(/[``]/);

            let keys = pseudoKeys
                            .filter(pseudo => pseudo[0]!==' ')
                            .filter(key => key !== '');

            let tipos = pseudoKeys
                            .filter(pseudo => pseudo[0]===' ')
                            .map(pseudoTipo => {
                                
                                if (pseudoTipo.indexOf('date') === 1) {
                                    return 'Date';
                                }

                                return pseudoTipo.substring(1, pseudoTipo.indexOf('('))
                            })
                            .filter(key => key !== '')
                            .map(tipo => tipo
                                            .replace(/int|decimal/gi, 'number')
                                            .replace('varchar', 'string')
                                            .replace('bit', 'boolean'))


            if (keys.length !== tipos.length) {
                keys.shift();
            }

            jsKeys = keys
                            .map((key, i) => `${key}: ${tipos[i]}`);

            generateModel(nombreTabla, jsKeys, keys, tipos);

        });

        connection.end();
        

    }




    const generateModel = (nombreTabla, jsKeys, keys, tipos) => {
        const nombreTablaLower = nombreTabla[0].toLowerCase() + nombreTabla.substring(1);

        const resultadoModelo =`
    export class ${upperFirstLetter(nombreTabla)}{
        ${arrayKeysToString(jsKeys)}

        constructor (${nombreTablaLower}?: {
            ${arrayKeysToString(jsKeys)}
        }) {
            if (${nombreTablaLower}) {
                ${generateAssingsKeys(keys, nombreTablaLower)}
            } else {
                ${generateAssingsKeysNull(keys)}
            }
        }

    }`;

        fs.writeFile(`C:/Users/kernel/German/Projects/facturacion/src/app/models/${nombreTablaLower}.ts`, resultadoModelo, function(err) {
            if(err) {
                return console.log(err);
            }
        
            console.log("El modelo fue generado y guardado correctamente");
        }); 

        
        
    }


    const arrayKeysToString = (jsKeys) => {
        return jsKeys.toString().split(',').join(';\n');
    }

    const generateAssingsKeys = (keys, nombreTablaLower) => {
        return keys.map((key, i) => `this.${key} = ${nombreTablaLower}.${key}`).toString().split(',').join(';\n');
    }

    const generateAssingsKeysNull = (keys) => {
        return keys.map((key, i) => `this.${key} = null`).toString().split(',').join(';\n');
    }
