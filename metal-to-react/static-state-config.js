/**
 * A transform that converts object-assigned PROPS configuraiton
 * to class-based static initialized configuration. In other words...
 *
 * It should convert this:
 *
 *   MyComponent.PROPS = {
 *     foo: Config.string().required()
 *   };
 *
 * To this:
 *
 *   class MyComponent extends Component {
 *     static PROPS = {
 *       foo: Config.string().required()
 *     }
 *   }
 */

import {isStateProperty} from './utils/isStateProperty';

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	const addedCounts = new Map();

	root.find(j.MemberExpression)
		.filter(path => isStateProperty(path.node.property.name))
		.forEach(path => {
			const {node} = path.parent;
			const className = node.left.object.name;
			const propName = node.left.property.name;
			const configNode = node.right;

			j(path)
				.closestScope()
				.find(j.ClassDeclaration)
				.filter(({node}) => node.id.name === className)
				.forEach(({node}) => {
					const body = node.body.body;

					const count = addedCounts.get(className) || 0;

					body.splice(
						count,
						null,
						j.classProperty(
							j.identifier(propName) /* key */,
							configNode /* value expression */,
							null /* type annotation */,
							true /* static */
						)
					);

					addedCounts.set(className, count + 1);
				});
		})
		.map(path => path.parent)
		.remove();

	return root.toSource({
		useTabs: true
	});
};
