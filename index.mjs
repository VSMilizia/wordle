/**
 * Implementare WORDLE. [https://www.nytimes.com/games/wordle/index.html]
 *   Ogni tentativo deve avere 4 lettere valide.
 *
 *   Il colore della lettera deve cambiare secondo le seguenti regole:
 *
 *   VERDE: la lettera è contenuta nella soluzione nella posizione giusta
 *   GIALLO: la lettera è contenuta nella soluzione ma NON nella posizione giusta
 *   GRIGIO: la lettera non è contenuta nella soluzione
 *
 * */

import chalk from 'chalk';
import readline from 'readline';
import dotenv from 'dotenv'
import validator from 'validator';
dotenv.config()


// https://nodejs.org/api/readline.html#readlinecreateinterfaceoptions
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

// Chiama una parola di n lettere con n variabile
const solutionAPI = async function (wordLength) {

    let solution;
    const url = `https://random-words5.p.rapidapi.com/getRandom?wordLength=${wordLength}`;
    const options = {
        method: 'GET',

        headers: {
            'x-rapidapi-key': process.env.API_KEY,
            'x-rapidapi-host': process.env.API_HOST
        }
    };

    const response = await fetch(url, options);
    solution = await response.text();
    console.log("Soluzione da API: " + solution);
    return solution
}

// Domanda a terminale di colore giallo
const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(chalk.yellow(question), (answer) => {
            resolve(answer.trim()); // Rimuove spazi bianchi extra
        });
    });
};

// Conta quante volte una lettera (letter) è contenuta in una parola (word)
const countOccurrences = (word, letter) => {
    return word.split("").filter(char => char === letter).length;
}

// funzione di verifica
const wordChecker = function (word, current) {
    let result = [];

    // ATTENZIONE ALLE PAROLE maiuscole/minuscole.
    word = word.toUpperCase();          // parola di tentativo
    current = current.toUpperCase();    //parola di soluzione

    // controllo lettera per lettera in parola
    for (let index in word) {
        let letter = word[index];

        if (current.includes(letter)) {
            if (word[index] === current[index]) {
                result.push(chalk.green(letter));   // VERDE: la lettera è contenuta nella parola nella posizione giusta
                current = current.replace(letter, "_");
            } else if (countOccurrences(word,letter) > countOccurrences(current,letter)) {
                result.push(chalk.gray(letter));    // GRIGIO: la lettera è contenuta nella parola ma in numero minore
            } else {
                result.push(chalk.yellow(letter));  // GIALLO: la lettera è contenuta nella parola ma NON nella posizione giusta
                current = current.replace(letter, "_");
            };
        } else {
            result.push(chalk.gray(letter));        // GRIGIO: la lettera non è contenuta nella parola
        }
    }

    // ritorno un risultato composto dalle lettere colorate
    // sucess è un boolano per fare uscire dal gioco se l'utente indovina la parola
    return {
        'data': result,
        'success': current.split("").every(char => char === "_")
    }
}

// funzione di Gioco
const game = function (attempt, max, solution) {
    // https://nodejs.org/api/readline.html#rlquestionquery-options-callback
    rl.question(chalk.blue(`Inserisci una parola di ${wordGameLength} caratteri: `), function (answer) {
        
        // usiamo una safe word per uscire dal ciclo
        if (answer === 'exit') {
            return rl.close();
        }
        
        // controlla di aver inserito esattamente wordGameLength caratteri altrimenti dai un errore
        if (answer.length !== wordGameLength) {
            console.log('\n', chalk.red(`Devi inserire ${wordGameLength} caratteri.`));
            game(attempt, maxGameAttempt, solution);
        } else {
            console.log('\n', `Tentativo ${attempt + 1} di ${maxGameAttempt}`);
            ++attempt;

            let result = wordChecker(answer, solution);
            console.log("\t\t" + result.data.join(""));

            if (result.success) {
                console.log(chalk.green(' >> HAI VINTO << '));
                return rl.close();
            }

            if (attempt === maxGameAttempt) {
                console.log('\n', chalk.red(`Spiacente hai terminato i ${maxGameAttempt} tentativi. La soluzione era ${solution}`), '\n');
                return rl.close();
            }
            // Richiamo la funzione fino a esaurimento dei tentativi
            game(attempt, maxGameAttempt, solution);

        }
    });
}

var maxGameAttempt = 0 ; //Inizializzazione dei parametri globali
var wordGameLength = 0 ; 

const startGame = async () => {

    // Soluzione dinamica
    maxGameAttempt = parseInt( await askQuestion("Inserisci numero massimo di tentativi: "));
    wordGameLength = parseInt( await askQuestion("Lunghezza parola: "));

    // Se gli input non solo validi interrompe il gioco
    if (isNaN(maxGameAttempt)||isNaN(wordGameLength)){
        console.log("Input non validi");
        return;
    }

    // Chiede la soluzione
    const solution = await solutionAPI(wordGameLength);
    console.log(chalk.green(`La tua partita è pronta, BUONA FORTUNA!`));
    
    let attempt = 0 // Contatore dei tentativi

    // Inizia il gioco
    game(attempt, maxGameAttempt, solution);
}

startGame();
