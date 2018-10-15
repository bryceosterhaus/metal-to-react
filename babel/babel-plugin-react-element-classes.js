/*
 * This plugin is a proof of concept for getting `elementClasses` to behave similarly to
 * how they work in metal-jsx. This plugin is not intended for production use.
*/

module.exports = function(babel) {
	const {types: t} = babel;

	const elementClassesExpression = t.memberExpression(
		t.memberExpression(t.thisExpression(), t.identifier('props')),
		t.identifier('elementClasses')
	);

	const elementClassesString = t.binaryExpression(
		'+',
		t.stringLiteral(' '),
		elementClassesExpression
	);

	const elementClassesTernary = t.conditionalExpression(
		elementClassesExpression,
		elementClassesString,
		t.stringLiteral('')
	);

	const classNameAttribute = t.jSXAttribute(
		t.jSXIdentifier('className'),
		t.jSXExpressionContainer(elementClassesTernary)
	);

	const addToClassName = classNameAttr => {
		const prevVal = classNameAttr.value;
		if (prevVal.type === 'JSXExpressionContainer') {
			classNameAttr.value.expression = t.binaryExpression(
				'+',
				prevVal.expression,
				elementClassesTernary
			);
		} else if (prevVal.type === 'StringLiteral') {
			classNameAttr.value = t.jSXExpressionContainer(
				t.binaryExpression('+', prevVal, elementClassesTernary)
			);
		}
	};

	return {
		name: 'element-classes',
		visitor: {
			ReturnStatement(path) {
				const functionParent = path.getFunctionParent();

				if (
					functionParent.node.id &&
					functionParent.node.id.name === 'render'
				) {
					if (path.node.argument.type === 'JSXElement') {
						const firstElementOpening =
							path.node.argument.openingElement;

						if (firstElementOpening.name === 'svg') {
							return;
						}

						const classNameAttr = firstElementOpening.attributes.find(
							attr => attr.name && attr.name.name === 'className'
						);

						if (classNameAttr) {
							addToClassName(classNameAttr);
						} else {
							firstElementOpening.attributes.push(
								classNameAttribute
							);
						}
					}
				}
			}
		}
	};
};
