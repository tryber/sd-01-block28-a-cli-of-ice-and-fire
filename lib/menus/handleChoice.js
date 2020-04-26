const { parseLinks } = require('../utils');

function handleChoice({ selectChoice }, goBack, dependencies, { url, link, message, run }) {
  const { inquirer, log } = dependencies;
  const links = parseLinks(link);
  if (selectChoice === 'back') return goBack();
  if (selectChoice === 'next' || selectChoice === 'prev') {
    return run(goBack, dependencies, links[selectChoice]);
  }

  if (!selectChoice.url) return;

  log(selectChoice);
  return inquirer.prompt({
    type: 'confirm',
    message,
    name: 'repeat',
    default: true,
  }).then(answers => repeatChoice(answers, goBack, dependencies, url, run));
}

function repeatChoice({ repeat }, goBack, dependencies, url, run) {
  if (!repeat) return;
  return run(goBack, dependencies, url);
}

module.exports = { handleChoice };