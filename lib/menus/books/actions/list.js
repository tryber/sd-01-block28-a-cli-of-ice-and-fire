const fetch = require('node-fetch');
const inquirer = require('inquirer');
const actionsModule = require('../actions');

const getBookName = () => {
  return inquirer
    .prompt({
      type: 'input',
      name: 'Fetch',
      message: `-- Menu de livros -- 
Digite o nome do livro →`,
    })
    .then(({ Fetch }) => Fetch);
};

const caseObjIsFalse = (goBack) => {
  console.log(`
|-------------------------------|  
|     Sua busca está vazia      |
|             ___               |
|            (._.)              |
|            <|>                |
|            _/\_                |
|                               | 
| Voltando para o menu anterior |
|-------------------------------|
`);
  goBack();
};

const showTheBook = (dataBook) => {
  return dataBook.map((data) =>
    console.log(`${data.name}
  ${data.isbn}
  ${data.authors}
  ${data.numberOfPages}
  ${data.publisher}
  ${data.country}
  ${data.mediaType}
  ${data.release}
  ${data.numberOfPages}
  ${data.publisher}`)
  );
};

const caseObjIsTrue = async (goBack, dependencies = {}, valuebyFetch) => {
  const { inquirer, actions = actionsModule } = dependencies;
  const line = new inquirer.Separator();
  const choices = [];

  await valuebyFetch.map(({ name }) => {
    choices.push(line);
    choices.push(name);
    choices.push({ name: 'Voltar para o menu anterior', value: 'back' });
    choices.push(line);
  });
  return inquirer
    .prompt({
      type: 'list',
      message: '[Listar Livros] - Escolha um livro para ver mais detalhes',
      name: 'book',
      choices,
    })
    .then(({ book }) => {
      if (book === 'back') return goBack();
      return run(goBack, dependencies)
      // if (actions[book]) {

      //   return actions[book].run(() => run(goBack, dependencies), dependencies);
      // }

      // return false;
    });
};

const getUrl = (value) => {
  return `https://anapioficeandfire.com/api/books/?name=${value}`;
};

const showSearchResponse = async () => {
  const bookName = await getBookName();
  const valueResponse = await fetch(`${getUrl(bookName)}`).then((response) =>
    response.json()
  );
  return valueResponse;
};

const run = async (goBack, dependencies = {}) => {
  const valueFinal = await showSearchResponse();
  if (valueFinal.length > 0)
    return caseObjIsTrue(goBack, dependencies, valueFinal);
  return caseObjIsFalse(goBack);
};

module.exports = { run };