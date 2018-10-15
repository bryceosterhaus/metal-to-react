/**
 *
 * It should convert this:
 *
 *    const STORE = {
 *       foo: Config.instanceOf(Map),
 *       bar: Config.func(),
 *       baz: Config.instanceOf(Map)
 *    };
 *
 *    Component.PROPS = {
 *       ...STORE,
 *       qux: Config.number()
 *    };
 *
 * To this:
 *
 *    Component.PROPS = {
 *        qux: Config.number(),
 *        foo: Config.instanceOf(Map),
 *        bar: Config.func(),
 *        baz: Config.instanceOf(Map)
 *    };
 */

import {isStateProperty} from './utils/isStateProperty';

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);

	root.find(j.ClassProperty)
		.filter(path => isStateProperty(path.node.key.name))
		.forEach(path => {
			const spreadElements = j(path).find(j.SpreadElement);

			if (spreadElements.length) {
				spreadElements.forEach(path => {
					const name = path.node.argument.name;
					const parentNode = path.parent.node;

					const variableDeclarators = j(path)
						.closestScope()
						.findVariableDeclarators(name);

					if (variableDeclarators.length) {
						variableDeclarators
							.forEach(path => {
								parentNode.properties.push(
									...path.node.init.properties
								);
							})
							.remove();

						j(path).remove();
					}
				});
			} else if (path.node.value.type === 'Identifier') {
				let properties = [];

				j(path)
					.closestScope()
					.findVariableDeclarators(path.node.value.name)
					.forEach(path => {
						properties.push(...path.node.init.properties);
					})
					.remove();

				path.node.value = j.objectExpression(properties);
			}
		});

	return root.toSource({
		useTabs: true
	});
};
