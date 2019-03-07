/**
 *
 * It should convert this:
 *
 *   {...otherProps}
 *
 * To this:
 *
 *   {...omitDefinedProps(otherProps, SomeClass.propTypes)}
 * 
 * Note:
 * You'll also need to do a find & replace for "METAL_JSX_CODE_MOD: REPLACE WITH CORRECT PATH"
 * and replace that with the path to your omitDefinedProps util function. That function should look
 * something like...
 * 
 * import {omit} from 'lodash';
 * function omitPropTypes(otherProps, propTypes) {
 *    return omit(otherProps, Object.keys(propTypes));
 * }
 * 
 */

export default function transformer(file, api) {
	const j = api.jscodeshift;
	const root = j(file.source);

	let usedOmit = false;

	root.find(j.ClassDeclaration).forEach(classDeclaration => {
		const expressionNode = j.callExpression(
			j.identifier('omitDefinedProps'),
			[
				j.identifier('otherProps'),
				j.memberExpression(
					classDeclaration.node.id,
					j.identifier('propTypes')
				)
			]
		);

		j(classDeclaration)
			.find(j.JSXSpreadAttribute, {
				argument: {name: 'otherProps'}
			})
			.replaceWith(() => {
				usedOmit = true;

				return j.jsxSpreadAttribute(expressionNode);
			});

		j(classDeclaration)
			.find(j.SpreadElement, {
				argument: {name: 'otherProps'}
			})
			.replaceWith(() => {
				usedOmit = true;

				return j.spreadElement(expressionNode);
			});
	});

	if (usedOmit) {
		root.find(j.ImportDeclaration, {
			source: {value: 'react'}
		}).insertBefore(
			j.importDeclaration(
				[j.importDefaultSpecifier(j.identifier('omitDefinedProps'))],
				j.literal('METAL_JSX_CODE_MOD: REPLACE WITH CORRECT PATH')
			)
		);
	}

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
}
