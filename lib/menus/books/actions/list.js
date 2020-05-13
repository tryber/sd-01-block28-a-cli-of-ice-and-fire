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
async function run(goBack, dependencies = {}, url) {
  const { inquirer, superagent = superagentModule, log = console.log } = dependencies;
  let bookName = await searchedBookName(dependencies);
  return new Promise((resolve, reject) => {
    const request = superagent.get(url || `https://www.anapioficeandfire.com/api/books?name=${bookName}`);

    if (!url) request.query({ page: 1, pageSize: 10 });

    request.then(({ body, headers: { link } }) => {
      if (body.length === 0) {
        console.log("Livro Inexistente")
        return goBack()
      }
      const choices = body.map((books) => {
        const { name, characters, povCharacters, ...rest } = books;

        return {
          name: name,
          value: rest,
        };
      });

      choices.push(new inquirer.Separator());

      const links = parseLinks(link);

      if (links.next) {
        choices.push({ name: 'Próxima página', value: 'next' });
      }

      if (links.prev) {
        choices.push({ name: 'Página anterior', value: 'prev' });
      }

      choices.push({ name: 'Voltar para o menu de personagens', value: 'back' });

      choices.push(new inquirer.Separator());

      return inquirer.prompt({
        type: 'list',
        message: '[Listar Personagens] - Escolha uma personagem para ver mais detalhes',
        name: 'book',
        choices,
      })
        .then(({ book }) => {
          if (book === 'back') return goBack();
          if (book === 'next' || book === 'prev') {
            return resolve(run(goBack, dependencies, links[book]));
          }

          if (!book.url) return resolve();

          log(book);

          return inquirer.prompt({
            type: 'confirm',
            message: 'Deseja consultar outra personagem?',
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

