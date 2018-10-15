const util = require('util');
const exec = util.promisify(require('child_process').exec);

const npmDependencies = [
	'react',
	'react-dom',
	'react-redux',
	'prop-types',
	'babel-preset-react',
	'@reach/router'
];

async function installDependencies() {
	const {stdout, stderr} = await exec(
		'npm i --save ' + npmDependencies.join(' ')
	);
}

installDependencies();
