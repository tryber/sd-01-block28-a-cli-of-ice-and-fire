const superagentModule = require('superagent');

const { parseLinks } = require('../../../utils');

function searchedBookName({ inquirer }) {
  return inquirer.prompt({
    type: 'input',
    message: 'Digite o nome do livro',
    name: 'answer',
    default: '',
  }).then(({ answer }) => answer);
}


function reqBooks(parameters, resolve, req) {
  const { goBack, dependencies, url, choices, links } = parameters;
  const { inquirer, log = console.log } = dependencies;
  return inquirer.prompt({
    type: 'list',
    message: '[Listar livros] - Escolha um livro para ver mais detalhes',
    name: 'book',
    choices,
  })
    .then(({ book }) => {
      if (book === 'back') return goBack();
      if (book === 'next' || book === 'prev') return resolve(req(goBack, dependencies, links[book]));
      if (!book.url) return resolve();
      log(book);
      return inquirer.prompt({
        type: 'confirm',
        message: 'Deseja consultar outro livro?',
        name: 'repeat',
        default: true,
      }).then(({ repeat }) => {
        if (!repeat) return resolve();
        return resolve(req(goBack, dependencies, url));
      });
    });
}

function createChoices(body) {
  return body.map((books) => {
    const { name, characters, povCharacters, ...rest } = books;
    return {
      name,
      value: rest,
    };
  });
}


async function run(goBack, dependencies = {}, url) {
  const { inquirer, superagent = superagentModule } = dependencies;
  const bookName = url ? '' : await searchedBookName(dependencies);
  return new Promise((resolve) => {
    const request = superagent.get(url || `https://www.anapioficeandfire.com/api/books?name=${bookName}`);
    if (!url) request.query({ page: 1, pageSize: 10 });
    request.then(({ body, headers: { link } }) => {
      if (body.length === 0) {
        console.log('Não existe este livro');
        return goBack();
      }
      const choices = createChoices(body);
      choices.push(new inquirer.Separator());
      const links = parseLinks(link);
      if (links.next) choices.push({ name: 'Próxima página', value: 'next' });
      if (links.prev) choices.push({ name: 'Página anterior', value: 'prev' });
      choices.push({ name: 'Voltar para o menu de personagens', value: 'back' });
      choices.push(new inquirer.Separator());
      const parameters = { goBack, dependencies, url, choices, links };
      return reqBooks(parameters, resolve, run);
    });
  });
}

module.exports = { run };
