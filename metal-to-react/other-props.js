/**
 * A transform that converts the helper 'this.otherProps()'
 *
 * It should convert this:
 *
 *   this.otherProps();
 *
 * To this:
 *
 *   ...this.props;
 *
 * Or:
 *
 *   const {foo, ...others} = this.props;
 *
 *   ...others
 *
 */

function destructuredFromThis(j, path) {
	return !!j(path).find(j.VariableDeclarator, {
		id: {
			properties: [{key: {name: 'props'}}]
		},
		init: {type: 'ThisExpression'}
	}).length;
}

function destructuredFromProps(j, path) {
	return !!j(path).find(j.VariableDeclarator, {
		init: {
			object: {type: 'ThisExpression'},
			property: {
				name: 'props'
			}
		}
	}).length;
}

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	const destructureMap = new Map();
	const othersMap = new Map();

	root.find(j.CallExpression, {
		callee: {
			property: {
				name: 'otherProps'
			}
		}
	})
		.forEach(path => {
			const callExpressionPath = path;

			j(path)
				.closest(j.MethodDefinition)
				.find(j.VariableDeclaration)
				.forEach(path => {
					const hasOthersSpread = j(path).find(j.RestProperty, {
						argument: {name: 'otherProps'}
					}).length;

					if (destructuredFromProps(j, path)) {
						destructureMap.set(callExpressionPath, true);

						if (!hasOthersSpread) {
							path.node.declarations[0].id.properties.push(
								j.restProperty(j.identifier('otherProps'))
							);
						}
					} else if (destructuredFromThis(j, path)) {
						destructureMap.set(callExpressionPath, true);

						if (!hasOthersSpread) {
							path.node.declarations[0].id.properties
								.find(
									property =>
										property.key &&
										property.key.name === 'props'
								)
								.value.properties.push(
									j.restProperty(j.identifier('otherProps'))
								);
						}
					}
				});
		})
		.replaceWith(path => {
			return destructureMap.has(path)
				? j.identifier('otherProps')
				: j.memberExpression(j.thisExpression(), j.identifier('props'));
		});

	return root.toSource();
};
