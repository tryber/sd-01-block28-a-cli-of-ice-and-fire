const superagentModule = require('superagent');

const { handleChoice } = require('../../handleChoice.js');
const { addLinks } = require('../../addLinks.js');

const getDados = body => (
  body.map((book) => {
    const { name } = book;

    return {
      name: name,
      value: book,
    };
  })
);

async function choiceNameBook({ inquirer }) {
  return inquirer.prompt({
    type: 'input',
    message: 'Digite o nome do livro',
    name: 'answer',
    default: true,
  }).then(({ answer }) => answer);
}

async function run(goBack, dependencies = {}, url) {
  try {
    const { inquirer, superagent = superagentModule } = dependencies;

    const bookName = await choiceNameBook(dependencies);

    const { body, headers: { link } } = await superagent.get(url || `https://www.anapioficeandfire.com/api/books?name=${bookName}`);
    console.log(url)
    const choices = addLinks(getDados(body), link, dependencies, 'livros');

    const linkAndUrl = { url, link, message: 'Deseja consultar outro livro?', run };

    return inquirer.prompt({
      type: 'list',
      message: '[Listar Livros] - Escolha um livro para ver mais detalhes',
      name: 'selectChoice',
      choices,
    })
      .then(answers => handleChoice(answers, goBack, dependencies, linkAndUrl));
  } catch (err) {
    const log = console.log;
    return log(err);
  }
}

module.exports = { run };