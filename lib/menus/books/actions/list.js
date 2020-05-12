const superagentModule = require('superagent');

const { parseLinks } = require('../../../utils');

async function run(goBack, dependencies = {}, url) {
  return new Promise((resolve, reject) => {
    const { inquirer, superagent = superagentModule, log = console.log } = dependencies;

    const request = superagent.get(url || 'https://www.anapioficeandfire.com/api/books');

    if (!url) request.query({ page: 1, pageSize: 10 });

    request.end((err, { body, headers: { link } }) => {
      if (err) return reject(err);

      const choices = body.map((books) => {
        const { name, aliases } = books;

        return {
          name: name || aliases[0],
          value: books,
        };
      });
      console.log(choices);
      choices.push(new inquirer.Separator());

      const links = parseLinks(link);

      if (links.next) {
        choices.push({ name: 'Próxima página', value: 'next' });
      }

      if (links.prev) {
        choices.push({ name: 'Página anterior', value: 'prev' });
      }

      choices.push({ name: 'Voltar para o menu de livros', value: 'back' });

      choices.push(new inquirer.Separator());

      return inquirer.prompt({
        type: 'list',
        message: '[Listar Livros] - Escolha um livro para ver mais detalhes',
        name: 'books',
        choices,
      })
        .then(({ books }) => {
          if (books === 'back') return goBack();
          if (books === 'next' || books === 'prev') {
            return resolve(run(goBack, dependencies, links[books]));
          }

          if (!books.url) return resolve();

          log(books);

          return inquirer.prompt({
            type: 'confirm',
            message: 'Deseja consultar outra livro?',
            name: 'repeat',
            default: true,
          }).then(({ repeat }) => {
            if (!repeat) return resolve();
            return resolve(run(goBack, dependencies, url));
          });
        });
    });
  });
}

module.exports = { run };
