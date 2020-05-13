const fetch = require('node-fetch');
const inquirer = require('inquirer');
const { parseLinks } = require('../../../utils');
const { inquirerQuestion } = require('../../../../service/Functions');

const showTheBook = ({ swornMembers, ...house }) => {
  console.log(JSON.stringify(house));
};

const getHouseFromAPI = async (url) => {
  const response = await fetch(url);
  const json = await response.json();
  const headers = response.headers.get('link');
  return { json, headers };
};

const getUrl = () => 'https://www.anapioficeandfire.com/api/houses';

const values = {
  type: 'list',
  message: '[Listar Casas] - Escolha uma casa para ver mais detalhes',
  name: 'house',
};

const valuesInquirerFinaly = {
  type: 'confirm',
  message: 'Deseja consultar outra casa?',
  name: 'repeat',
  default: true,
};

const caseObjIsTrue = async (
  goBack,
  dependencies = {},
  valuebyFetch,
  nextOrPrev,
  callback,
) => {
  const { type, name, message } = values;
  const line = new inquirer.Separator();
  const choices = [];
  const link = parseLinks(nextOrPrev);
  const { next, prev } = link;
  choices.push(line);
  await valuebyFetch.map((house) =>
    choices.push({ name: house.name, value: house })
  );

  if (next) choices.push({ name: 'Próxima página', value: 'next' });
  if (prev) choices.push({ name: 'Página anterior', value: 'prev' });
  choices.push({ name: 'Voltar para o menu anterior', value: 'back' });
  choices.push(line);
  return inquirerQuestion(inquirer, type, name, message, choices).then(
    ({ house }) => {
      if (house === 'back') return goBack();
      if (house === 'next' || house === 'prev')
        return callback(goBack, dependencies, link[house]);
      showTheBook(house);
      return inquirer.prompt(valuesInquirerFinaly).then(({ repeat }) => {
        if (!repeat) {
          console.log('Obrigado. Volte sempre!');
          return null;
        }
        return callback(goBack, dependencies, getUrl());
      });
    }
  );
};

const run = async (goBack, dependencies = {}, url) => {
  if (url) {
    const { json, headers } = await getHouseFromAPI(url);
    return caseObjIsTrue(goBack, dependencies, json, headers, run);
  }

  const { json, headers } = await getHouseFromAPI(getUrl());
  return caseObjIsTrue(goBack, dependencies, json, headers, run);
};

module.exports = { run };
