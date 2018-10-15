const util = require('util');
const path = require('path');
const exec = util.promisify(require('child_process').exec);

const files = [
	'render-to-string',
	'replace-metal-render',
	'static-state-config',
	'add-store-to-props',
	'module-imports',
	'config-to-proptypes',
	'life-cycle-names',
	'jsx-class-to-classname',
	'jsx-style-attribute-comments',
	'other-props',
	'state-to-setstate',
	'anchor-to-router-link',
	'remove-static-state',
	'element-classes'
];

async function run(file) {
	const {stdout, stderr} = await exec(
		'jscodeshift ' +
			process.cwd() +
			' -t ' +
			path.join(__dirname, file) +
			'.js --parser babel'
	);
	console.log(
		stdout.replace(/(.|\W)*Results/, 'Results'),
		'End Transform: ',
		file.toUpperCase()
	);
	console.log('');
}

async function runAll() {
	console.log('RUNNING');

	for (const file of files) {
		console.log('Start Transform: ', file.toUpperCase());

		await run(file);
	}

	console.log('COMPLETE');
}

runAll();
