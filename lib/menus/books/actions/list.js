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

function listBooks(parameters, resolve, request) {
  const { goBack, dependencies, url, choices, links } = parameters;
  const { inquirer, log = console.log } = dependencies;
  return inquirer.prompt({
    type: 'list',
    message: '[Pesquisar Livros] - Escolha um livro para ver mais detalhes',
    name: 'books',
    choices,
  })
    .then(({ books }) => {
      if (books === 'back') return goBack();
      if (books === 'next' || books === 'prev')
        return resolve(request(goBack, dependencies, links[books]));
      if (!books.url) return resolve();
      log(books);
      return inquirer.prompt({
        type: 'confirm',
        message: 'Deseja consultar outro livro?',
        name: 'repeat',
        default: true,
      }).then(({ repeat }) => {
        if (!repeat) return resolve();
        return resolve(request(goBack, dependencies, url));
      });
    });
}

function createChoices(body) {
  return body.map((books) => {
    const { name, aliases } = books;
    const { characters, povCharacters, ...rest } = books;
    return {
      name: name || aliases[0],
      value: rest,
    };
  });
}

async function run(goBack, dependencies = {}, url) {
  const { inquirer, superagent = superagentModule, log = console.log } = dependencies;
  const bookName = await searchedBookName(dependencies);
  return new Promise((resolve, reject) => {
    const request = superagent.get(url || `https://www.anapioficeandfire.com/api/books?name=${bookName}`);
    if (!url) request.query({ page: 1, pageSize: 10 });
    request.end((err, { body, headers: { link } }) => {
      if (err) return reject(err);
      if (body.length === 0) {
        log('Livro Inexistente');
        return goBack();
      }
      const choices = createChoices(body)
      choices.push(new inquirer.Separator());

      const links = parseLinks(link);
      if (links.next) choices.push({ name: 'Próxima página', value: 'next' });
      if (links.prev) choices.push({ name: 'Página anterior', value: 'prev' });
      choices.push({ name: 'Voltar para o menu de livros', value: 'back' });
      choices.push(new inquirer.Separator());

      const parameters = { goBack, dependencies, url, choices, links };
      return listBooks(parameters, resolve, run);
    });
  });
}

module.exports = { run };
