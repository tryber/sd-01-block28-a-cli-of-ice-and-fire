const actionsModule = require('./actions');
const { inquirerQuestion } = require('../../../service/Functions');

const values = {
  type: 'list',
  name: 'actionHouses',
  message: 'Menu de Casas -- Escolha uma ação',
  choices: [
    { name: 'Listar Casas', value: 'list' },
    { name: 'Voltar', value: 'back' },
  ],
};

const run = (goBack, dependencies = {}) => {
  const { inquirer, actions = actionsModule } = dependencies;

  const { type, name, message, choices } = values;

  return inquirerQuestion(inquirer, type, name, message, choices).then(
    ({ actionHouses }) => {
      if (actionHouses === 'back') return goBack();

      if (actions[actionHouses])
        return actions[actionHouses].run(
          () => run(goBack, dependencies),
          dependencies,
        );
      return false;
    },
  );
};

module.exports = { run };
